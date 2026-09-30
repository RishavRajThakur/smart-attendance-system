import React, { useState } from 'react';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [matchThreshold, setMatchThreshold] = useState(0.65);
  const [defaulterThreshold, setDefaulterThreshold] = useState(75);
  const [duplicateLockMinutes, setDuplicateLockMinutes] = useState(45);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">System Settings</h1>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Configuration parameters updated and stored in active runtime memory.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Facial AI Recognition Parameters */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Face Recognition</h2>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-slate-700">Cosine Similarity Threshold</label>
              <span className="font-mono font-bold text-blue-600">{(matchThreshold * 100).toFixed(0)}% ({matchThreshold})</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.90"
              step="0.05"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Recommended: 0.60 – 0.65 for optimal FAR / FRR balance.</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-slate-700">Anti-Duplicate Window</label>
              <span className="font-mono font-bold text-blue-600">{duplicateLockMinutes} Minutes</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={duplicateLockMinutes}
              onChange={(e) => setDuplicateLockMinutes(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Prevents repetitive attendance logs for identical faces in the same session.</p>
          </div>
        </div>

        {/* Card 2: Academic Compliance Radar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">University Attendance Rule</h2>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-slate-700">Minimum Statutory Percentage</label>
              <span className="font-mono font-bold text-emerald-600">{defaulterThreshold}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="85"
              step="1"
              value={defaulterThreshold}
              onChange={(e) => setDefaulterThreshold(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard UGC/AICTE minimum guideline is 75.0%.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
            <div className="font-bold text-slate-800">Faculty In-Charge:</div>
            <div className="text-slate-600 font-medium">Prof. Manas Ranjan Biswal (Faculty • CSE)</div>
            <div className="text-slate-400 text-[11px]">Academic Year 2026 • 7th Semester B.Tech Major Project</div>
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => {
            setMatchThreshold(0.65);
            setDefaulterThreshold(75);
            setDuplicateLockMinutes(45);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          Reset to Factory Defaults
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition cursor-pointer"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
