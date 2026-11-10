import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { AttendanceSession, RecognizedFace, Course, Student, AttendanceRecord } from '../types';
import { handleAvatarError, DEFAULT_AVATAR } from '../utils/avatar';

interface LiveKioskPageProps {
  onNavigate?: (page: string) => void;
  userRole?: string;
}

export const LiveKioskPage: React.FC<LiveKioskPageProps> = ({ onNavigate, userRole = 'faculty' }) => {
  const [attendanceMode, setAttendanceMode] = useState<'face' | 'manual'>('face');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Camera & Face AI State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recognizedFeed, setRecognizedFeed] = useState<RecognizedFace[]>([]);
  const [scanStats, setScanStats] = useState({ totalScanned: 0, markedToday: 0 });

  // Manual Attendance State
  const [manualSearch, setManualSearch] = useState('');
  const [manualFilter, setManualFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'UNMARKED'>('ALL');
  const [manualToast, setManualToast] = useState<string | null>(null);

  // New Class Session Modal State
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newCourseId, setNewCourseId] = useState<number | ''>('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newThreshold, setNewThreshold] = useState(0.65);
  const [sessionFormLoading, setSessionFormLoading] = useState(false);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);

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
    loadInitialData();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionRecords(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadInitialData = async () => {
    try {
      const [sessionsData, coursesData, studentsData] = await Promise.all([
        api.getSessions(),
        api.getCourses().catch(() => []),
        api.getStudents().catch(() => [])
      ]);
      setSessions(sessionsData);
      setCourses(coursesData);
      setStudents(studentsData);

      if (coursesData.length > 0) {
        setNewCourseId(coursesData[0].id);
      }

      if (sessionsData.length > 0) {
        const active = sessionsData.find((s) => s.status === 'active') || sessionsData[0];
        setSelectedSessionId(active.id);
      }
    } catch (err) {
      console.error('Failed to load initial kiosk data', err);
    }
  };

  const loadSessionRecords = async (sessionId: number) => {
    try {
      const recs = await api.getRecords({ session_id: sessionId });
      setSessionRecords(recs);
      const presentCount = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      setScanStats((prev) => ({ ...prev, markedToday: presentCount }));
    } catch (err) {
      console.error('Failed to load session records', err);
    }
  };

  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId) {
      setSessionFormError('Please select a course for this session.');
      return;
    }
    if (!newSessionTitle.trim()) {
      setSessionFormError('Please provide a session lecture/lab title.');
      return;
    }

    try {
      setSessionFormLoading(true);
      setSessionFormError(null);
      const newSession = await api.createSession({
        course_id: Number(newCourseId),
        session_title: newSessionTitle.trim(),
        match_threshold: newThreshold
      });

      setSessions((prev) => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
      setScanStats({ totalScanned: 0, markedToday: 0 });
      setShowNewSessionModal(false);
      setNewSessionTitle('');
    } catch (err: any) {
      setSessionFormError(err.message || 'Failed to create attendance session');
    } finally {
      setSessionFormLoading(false);
    }
  };

  const handleMarkStudent = async (studentId: number, status: 'PRESENT' | 'LATE' | 'ABSENT', studentName?: string) => {
    if (!selectedSessionId) {
      alert('Please select an active session first.');
      return;
    }

    try {
      const updatedRec = await api.manualMark({
        session_id: selectedSessionId,
        student_id: studentId,
        status: status,
        remarks: 'Marked by faculty'
      });

      // Update session records locally
      setSessionRecords((prev) => {
        const filtered = prev.filter((r) => r.student_id !== studentId);
        return [updatedRec, ...filtered];
      });

      // Update scan stats count
      setScanStats((prev) => {
        const wasPresent = sessionRecords.some((r) => r.student_id === studentId && (r.status === 'PRESENT' || r.status === 'LATE'));
        const nowPresent = status === 'PRESENT' || status === 'LATE';
        const diff = nowPresent && !wasPresent ? 1 : !nowPresent && wasPresent ? -1 : 0;
        return { ...prev, markedToday: Math.max(0, prev.markedToday + diff) };
      });

      if (studentName) {
        setManualToast(`Marked ${studentName} as ${status}`);
        setTimeout(() => setManualToast(null), 2500);
      }
    } catch (err: any) {
      console.error('Manual mark failed', err);
      alert(err.message || 'Failed to record attendance mark');
    }
  };

  const handleMarkAll = async (status: 'PRESENT' | 'ABSENT') => {
    if (!selectedSessionId) return;
    if (!confirm(`Mark all ${students.length} students as ${status} for this session?`)) return;

    try {
      for (const st of students) {
        await api.manualMark({
          session_id: selectedSessionId,
          student_id: st.id,
          status: status,
          remarks: `Bulk marked ${status} by faculty`
        });
      }
      loadSessionRecords(selectedSessionId);
      setManualToast(`All students marked as ${status}`);
      setTimeout(() => setManualToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to complete bulk mark');
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
      startScanLoop();
    } catch (err) {
      console.error('Camera access error', err);
      setCameraError('Camera access denied or webcam not connected. Please allow browser camera permissions.');
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
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setCameraActive(false);
  };

  const startScanLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const base64Data = tempCanvas.toDataURL('image/jpeg', 0.85);

      try {
        const response = await api.recognizeFrame({
          session_id: selectedSessionId || undefined,
          image_base64: base64Data,
          min_confidence: 0.60
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const face of response.faces) {
          const [x, y, w, h] = face.bounding_box;
          let strokeColor = '#f59e0b';
          let tagText = 'Unknown Student';

          if (face.is_recognized) {
            if (face.attendance_status === 'MARKED') {
              strokeColor = '#10b981';
              tagText = `✓ MARKED: ${face.full_name} (${face.roll_number})`;
              playChime();
              setScanStats((s) => ({ ...s, markedToday: s.markedToday + 1 }));
              if (selectedSessionId) loadSessionRecords(selectedSessionId);
            } else if (face.attendance_status === 'ALREADY_PRESENT') {
              strokeColor = '#2563eb';
              tagText = `✓ PRESENT: ${face.full_name}`;
            } else if (!selectedSessionId) {
              strokeColor = '#3b82f6';
              tagText = `👤 ${face.full_name} (Select Session to Mark)`;
            } else {
              strokeColor = '#10b981';
              tagText = `${face.full_name} (${face.roll_number})`;
            }

            setRecognizedFeed((prev) => [face, ...prev.filter((p) => p.roll_number !== face.roll_number)].slice(0, 15));
          }

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = strokeColor;
          ctx.font = 'bold 13px Inter, sans-serif';
          const textWidth = ctx.measureText(tagText).width;
          ctx.fillRect(x, Math.max(0, y - 26), textWidth + 18, 26);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(tagText, x + 9, Math.max(18, y - 8));
        }

        setScanStats((s) => ({ ...s, totalScanned: s.totalScanned + response.faces.length }));
      } catch (err) {
        console.error('Frame recognition error', err);
      }
    }, 850);
  };

  // If Admin attempts to view Kiosk, display institutional administrative safety guard
  if (userRole === 'admin') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto select-none py-12 text-center">
        <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">Faculty Attendance Terminal</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Attendance taking is managed directly by faculty instructors during class sessions. As an administrator, you manage courses, faculty, students, and institutional records.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => onNavigate && onNavigate('records')}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              View Attendance Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate session manual stats
  const sessionStudentMap = new Map<number, AttendanceRecord>();
  sessionRecords.forEach((r) => sessionStudentMap.set(r.student_id, r));

  const presentCount = students.filter((s) => {
    const r = sessionStudentMap.get(s.id);
    return r && (r.status === 'PRESENT' || r.status === 'LATE');
  }).length;

  const lateCount = students.filter((s) => {
    const r = sessionStudentMap.get(s.id);
    return r && r.status === 'LATE';
  }).length;

  const absentCount = students.filter((s) => {
    const r = sessionStudentMap.get(s.id);
    return r && r.status === 'ABSENT';
  }).length;

  const unmarkedCount = Math.max(0, students.length - (presentCount + absentCount));

  // Filtered students for manual view
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(manualSearch.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(manualSearch.toLowerCase());
    if (!matchesSearch) return false;

    const r = sessionStudentMap.get(s.id);
    const status = r ? r.status : 'UNMARKED';

    if (manualFilter === 'PRESENT') return status === 'PRESENT' || status === 'LATE';
    if (manualFilter === 'LATE') return status === 'LATE';
    if (manualFilter === 'ABSENT') return status === 'ABSENT';
    if (manualFilter === 'UNMARKED') return status === 'UNMARKED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header & Session Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 font-heading">Take Attendance</h1>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAttendanceMode('face')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  attendanceMode === 'face'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Face Attendance</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setAttendanceMode('manual');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  attendanceMode === 'manual'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Manual Attendance</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Session Dropdown */}
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2">
            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Session:</span>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-900">
                  {s.course_code ? `${s.course_code} - ` : ''}{s.session_title}
                </option>
              ))}
            </select>
          </div>

          {/* New Session Button */}
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition cursor-pointer"
            title="Create a new class attendance session"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Session</span>
          </button>

          {/* Camera Start / Stop Toggle (Only in Face Attendance Mode) */}
          {attendanceMode === 'face' && (
            !cameraActive ? (
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
            )
          )}
        </div>
      </div>

      {manualToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{manualToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: FACE ATTENDANCE (CAMERA SCANNER & REAL FEED) */}
      {/* ======================================================== */}
      {attendanceMode === 'face' && (
        <>
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

          {!selectedSessionId && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>No active class session selected. Please select a session above or click <strong>"+ New Session"</strong> to record attendance.</span>
              </div>
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer shrink-0 ml-2"
              >
                + New Session
              </button>
            </div>
          )}

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
                    <h3 className="text-base font-extrabold text-white font-heading">Webcam Scanner Ready</h3>
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
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
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
                    <span className="font-semibold">Live AI Face Scanner Active</span>
                  </div>

                  <div className="absolute top-3 right-3 text-cyan-400 font-mono text-xs opacity-70">⬡ SCANNING</div>
                </div>
              )}

              {/* Status Legend */}
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
                  <span className="font-semibold text-slate-300">Amber: Unknown</span>
                </div>
              </div>
            </div>

            {/* Right: Live Session Attendee Stream */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recognized Attendees</h3>
                    <p className="text-[11px] text-slate-500">Live verifications in this session</p>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {presentCount} Present
                  </span>
                </div>

                <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
                  {recognizedFeed.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <div className="text-xs text-slate-400">
                        No faces recognized yet.
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
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setAttendanceMode('manual');
                }}
                className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Switch to Manual Attendance Sheet</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* MODE 2: MANUAL ATTENDANCE (FULL ROSTER SHEET & 1-CLICK TOGGLES) */}
      {/* ======================================================== */}
      {attendanceMode === 'manual' && (
        <div className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Total Students</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{students.length}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
              <div className="text-xs text-emerald-600 font-bold">Marked Present</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{presentCount}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
              <div className="text-xs text-rose-600 font-bold">Marked Absent</div>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">{absentCount}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm border-l-4 border-l-slate-400">
              <div className="text-xs text-slate-500 font-medium">Unmarked</div>
              <div className="text-2xl font-extrabold text-slate-700 mt-1">{unmarkedCount}</div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'PRESENT', 'ABSENT', 'UNMARKED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setManualFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    manualFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by student roll or name..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-full sm:w-56"
              />

              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
              >
                Mark All Present
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Manual Attendance Roster Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-6 py-4 text-right">Attendance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      const rec = sessionStudentMap.get(st.id);
                      const status = rec ? rec.status : 'NOT_MARKED';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={st.photo_url || DEFAULT_AVATAR}
                                alt={st.full_name}
                                onError={(e) => handleAvatarError(e, 'student')}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                              <div className="font-bold text-slate-900">{st.full_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-blue-600">
                            {st.roll_number}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {st.department} • Sem {st.semester} ({st.section})
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'LATE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : status === 'ABSENT'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {status === 'NOT_MARKED' ? 'Unmarked' : status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleMarkStudent(st.id, 'PRESENT', st.full_name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                ✓ Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStudent(st.id, 'LATE', st.full_name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  status === 'LATE'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                }`}
                              >
                                ⏱ Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStudent(st.id, 'ABSENT', st.full_name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  status === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                              >
                                ✗ Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 font-heading">Start New Attendance Session</h2>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {sessionFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
                {sessionFormError}
              </div>
            )}

            <form onSubmit={handleCreateNewSession} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject / Course</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code}: {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Session Title / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 12: Convolutional Neural Networks"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>Match Threshold</span>
                  <span className="font-mono text-blue-600">{(newThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.45"
                  max="0.85"
                  step="0.05"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sessionFormLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {sessionFormLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
