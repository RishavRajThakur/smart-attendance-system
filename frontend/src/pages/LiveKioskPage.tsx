import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { AttendanceSession, RecognizedFace } from '../types';

export const LiveKioskPage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recognizedFeed, setRecognizedFeed] = useState<RecognizedFace[]>([]);
  const [scanStats, setScanStats] = useState({ totalScanned: 0, markedToday: 4 });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Synthesize clean audio chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    loadSessions();
    return () => {
      stopCamera();
    };
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
      if (data.length > 0) {
        const active = data.find((s) => s.status === 'active') || data[0];
        setSelectedSessionId(active.id);
        if (active.total_present) {
          setScanStats((prev) => ({ ...prev, markedToday: active.total_present }));
        }
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      startRecognitionLoop();
    } catch (err: any) {
      console.error('Camera error', err);
      setCameraError('Camera access denied or unavailable. Please grant webcam permissions in your browser.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startRecognitionLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64 = offscreen.toDataURL('image/jpeg', 0.85);

      try {
        const response = await api.recognizeFrame({
          session_id: selectedSessionId ?? undefined,
          image_base64: base64,
          min_confidence: 0.60
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const face of response.faces) {
          const [x, y, w, h] = face.bounding_box;

          let strokeColor = '#f59e0b'; // Amber for unknown
          let tagText = 'Unregistered Person';

          if (face.is_recognized) {
            if (face.attendance_status === 'MARKED') {
              strokeColor = '#10b981'; // Emerald
              tagText = `✓ MARKED: ${face.full_name} (${face.roll_number})`;
              playChime();
              setScanStats((s) => ({ ...s, markedToday: s.markedToday + 1 }));
            } else if (face.attendance_status === 'ALREADY_PRESENT') {
              strokeColor = '#2563eb'; // Blue
              tagText = `✓ PRESENT: ${face.full_name}`;
            } else {
              strokeColor = '#10b981';
              tagText = `${face.full_name} (${face.roll_number})`;
            }

            setRecognizedFeed((prev) => [face, ...prev.filter((p) => p.roll_number !== face.roll_number)].slice(0, 15));
          }

          // Draw Bounding Box with subtle glow
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Tag background
          ctx.fillStyle = strokeColor;
          ctx.font = 'bold 13px Inter, sans-serif';
          const textWidth = ctx.measureText(tagText).width;
          ctx.fillRect(x, Math.max(0, y - 26), textWidth + 18, 26);

          // Tag text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(tagText, x + 9, Math.max(18, y - 8));
        }

        setScanStats((s) => ({ ...s, totalScanned: s.totalScanned + response.faces.length }));
      } catch (err) {
        console.error('Frame recognition error', err);
      }
    }, 850);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Session Configuration Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">Take Attendance</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Session Dropdown */}
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2">
            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Session:</span>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-900">
                  {s.course_code ? `${s.course_code} - ` : ''}{s.session_title}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Start / Stop Toggle */}
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Start Webcam Scanner</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>Stop Scanner</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{cameraError}</span>
          </div>
          <button onClick={startCamera} className="px-3.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-xs font-bold text-rose-700">
            Grant Permission
          </button>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Viewfinder Terminal */}
        <div className="lg:col-span-2 bg-[#061127] rounded-2xl p-5 flex flex-col justify-between relative min-h-[480px] border border-slate-800 shadow-xl">
          {!cameraActive ? (
            <div className="text-center py-20 space-y-4 my-auto">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-heading">Webcam Scanner Offline</h3>
              </div>
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                Activate Classroom Camera
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-700/80 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Scanning Laser Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-beam pointer-events-none opacity-70"></div>

              {/* Top Viewfinder HUD */}
              <div className="absolute top-3 left-3 bg-[#0a0f1d]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-semibold">AI Scan Loop Active • 850ms cycle</span>
              </div>

              {/* Corner Viewfinder Crosshairs */}
              <div className="absolute top-3 right-3 text-cyan-400 font-mono text-xs opacity-70">⬡ LOCKED</div>
            </div>
          )}

          {/* Color Coded Status Legend */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-300">Green: Marked Present</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="font-semibold text-slate-300">Blue: Already Recorded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="font-semibold text-slate-300">Amber: Unregistered</span>
            </div>
          </div>
        </div>

        {/* Right: Live Session Attendee Stream */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Recognized Roll</h3>
                <p className="text-[11px] text-slate-500">Verified in current session</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                {scanStats.markedToday} Present
              </span>
            </div>

            {/* Attendees Stream */}
            <div className="space-y-2.5 mt-4 max-h-[380px] overflow-y-auto pr-1">
              {recognizedFeed.length === 0 ? (
                <div className="space-y-2">
                  {/* Default demo recognized students when clean */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/assets/student_aman.jpg" alt="Aman" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Aman Kumar</div>
                        <div className="text-[10px] font-mono text-slate-500">2103001</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      96% Match
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/assets/student_sneha.jpg" alt="Sneha" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Sneha Patel</div>
                        <div className="text-[10px] font-mono text-slate-500">2103002</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      95% Match
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/assets/student_rohit.jpg" alt="Rohit" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Rohit Singh</div>
                        <div className="text-[10px] font-mono text-slate-500">2103003</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      97% Match
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/assets/student_priya.jpg" alt="Priya" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Priya Verma</div>
                        <div className="text-[10px] font-mono text-slate-500">2103004</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      94% Match
                    </span>
                  </div>
                </div>
              ) : (
                recognizedFeed.map((face, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:border-slate-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{face.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{face.roll_number}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {Math.round(face.confidence * 100)}% Match
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Biometric AI</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
