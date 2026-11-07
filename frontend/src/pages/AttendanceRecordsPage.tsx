import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { AttendanceRecord, AttendanceSession } from '../types';

interface AttendanceRecordsPageProps {
  userRole?: string;
}

export const AttendanceRecordsPage: React.FC<AttendanceRecordsPageProps> = ({ userRole = 'faculty' }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedSession]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recData, sessData] = await Promise.all([
        api.getRecords({ session_id: selectedSession ? Number(selectedSession) : undefined }),
        api.getSessions()
      ]);
      setRecords(recData);
      setSessions(sessData);
    } catch (err) {
      console.error('Failed to load records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (rec: AttendanceRecord) => {
    const nextStatus = rec.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      await api.manualMark({
        session_id: rec.session_id,
        student_id: rec.student_id,
        status: nextStatus,
        remarks: 'Manually toggled by faculty'
      });
      loadData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filtered = records.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 font-heading">
              {userRole === 'student' ? 'My Attendance History' : 'Attendance Records'}
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {records.length} Records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter by Session */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course_code ? `${s.course_code}: ` : ''}{s.session_title}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-44"
          />

          {/* Export CSV Button */}
          <a
            href={api.getExportCsvUrl(selectedSession ? Number(selectedSession) : undefined)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Verification Method</th>
                <th className="px-6 py-4">Attendance Status</th>
                {userRole !== 'student' && (
                  <th className="px-6 py-4 text-right">Faculty Adjustment</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={userRole === 'student' ? 5 : 6} className="text-center py-12 text-slate-400 font-semibold">
                    Loading records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'student' ? 5 : 6} className="text-center py-12 text-slate-400 font-semibold">
                    No records found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.student_name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{r.student_roll}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="font-medium text-slate-800">{new Date(r.marked_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className={`w-2 h-2 rounded-full ${r.verification_method === 'FACE_AI' ? 'bg-blue-600' : 'bg-slate-400'}`}></span>
                        <span>{r.verification_method}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {r.confidence_score > 0 ? `Match Confidence: ${Math.round(r.confidence_score * 100)}%` : 'Manual Override'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ✓ PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          ✕ ABSENT
                        </span>
                      )}
                    </td>
                    {userRole !== 'student' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStatusToggle(r)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          Toggle Status
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
