import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { DefaulterStudent } from '../types';

export const DefaultersPage: React.FC = () => {
  const [defaulters, setDefaulters] = useState<DefaulterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticeSentRoll, setNoticeSentRoll] = useState<string | null>(null);

  useEffect(() => {
    loadDefaulters();
  }, []);

  const loadDefaulters = async () => {
    try {
      setLoading(true);
      const data = await api.getDefaulters();
      setDefaulters(data);
    } catch (err) {
      console.error('Failed to load defaulters', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotice = (roll: string) => {
    setNoticeSentRoll(roll);
    setTimeout(() => {
      setNoticeSentRoll(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* High-Impact Regulatory Notice Banner */}
      <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 font-heading">Attendance Defaulters</h1>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  Below 75%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Color-Coded Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Red Highlight (Defaulter count) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Flagged Defaulters</div>
          <div className="text-3xl font-extrabold font-heading text-rose-600 mt-1">{defaulters.length} Students</div>
          <div className="text-[11px] text-slate-500 mt-1">Below statutory 75.0% requirement</div>
        </div>

        {/* Card 2: Amber Highlight (Statutory benchmark) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Statutory Benchmark</div>
          <div className="text-3xl font-extrabold font-heading text-amber-600 mt-1">75.0%</div>
          <div className="text-[11px] text-slate-500 mt-1">University Minimum Requirement</div>
        </div>

        {/* Card 3: Blue Highlight (Action mode) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Advisory Dispatch</div>
          <div className="text-3xl font-extrabold font-heading text-slate-900 mt-1">Notice</div>
          <div className="text-[11px] text-slate-500 mt-1">Debarment warning</div>
        </div>
      </div>

      {/* Defaulter Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-heading">Students Under 75% Threshold</h2>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
            {defaulters.length} Active Shortages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Classes Attended</th>
                <th className="px-6 py-4">Current Turnout</th>
                <th className="px-6 py-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">
                    Calculating university attendance audit radar...
                  </td>
                </tr>
              ) : defaulters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-emerald-600 font-semibold">
                    ✓ All enrolled students currently comply with the statutory &ge;75% requirement!
                  </td>
                </tr>
              ) : (
                defaulters.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{d.full_name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{d.roll_number}</td>
                    <td className="px-6 py-4 text-slate-600">{d.department}</td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {d.attended_sessions} / {d.total_sessions} classes
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-rose-600 font-mono">
                          {d.attendance_percentage.toFixed(1)}%
                        </span>
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, d.attendance_percentage)}%` }}
                            className="h-full bg-rose-500 rounded-full"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {noticeSentRoll === d.roll_number ? (
                        <span className="text-[11px] font-bold text-emerald-600">✓ Warning Dispatched</span>
                      ) : (
                        <button
                          onClick={() => handleSendNotice(d.roll_number)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition border border-rose-200 cursor-pointer"
                        >
                          Dispatch Notice
                        </button>
                      )}
                    </td>
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
