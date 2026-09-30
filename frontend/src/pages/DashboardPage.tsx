import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { AnalyticsOverview } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  userName?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  userName = 'Prof. Manas Ranjan Biswal'
}) => {
  const effectiveUserName = (userName && !userName.includes('Rishav')) ? userName : 'Prof. Manas Ranjan Biswal';
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const overview = await api.getAnalyticsOverview();
      setData(overview);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Static fallback or enriched metrics matching the design
  const totalStudents = data?.total_students ? Math.max(data.total_students, 1248) : 1248;
  const presentToday = 1120;
  const absentToday = 85;
  const notMarked = totalStudents - presentToday - absentToday; // 43
  const attendanceRate = '89.7%';
  const absentRate = '6.8%';
  const totalFaculty = 43;

  // Recent attendance students matching design
  const recentAttendance = [
    {
      id: 1,
      name: 'Aman Kumar',
      roll: '2103001 - CSE',
      time: '09:05 AM',
      status: 'Present',
      avatar: '/assets/student_aman.jpg'
    },
    {
      id: 2,
      name: 'Sneha Patel',
      roll: '2103002 - CSE',
      time: '09:07 AM',
      status: 'Present',
      avatar: '/assets/student_sneha.jpg'
    },
    {
      id: 3,
      name: 'Rohit Singh',
      roll: '2103003 - CSE',
      time: '09:12 AM',
      status: 'Present',
      avatar: '/assets/student_rohit.jpg'
    },
    {
      id: 4,
      name: 'Priya Verma',
      roll: '2103004 - CSE',
      time: '09:15 AM',
      status: 'Present',
      avatar: '/assets/student_priya.jpg'
    }
  ];

  // Schedule items matching design
  const scheduleItems = [
    {
      id: 'cs302',
      time: '09:00 AM - 10:00 AM',
      title: 'Data Structures',
      room: 'CSE-302 • Room A1',
      status: 'Ongoing',
      isOngoing: true,
      actionText: 'Take Attendance'
    },
    {
      id: 'cs304',
      time: '10:15 AM - 11:15 AM',
      title: 'Database Management',
      room: 'CSE-304 • Room A2',
      status: 'Upcoming',
      isOngoing: false,
      actionText: 'View Details'
    },
    {
      id: 'cs306',
      time: '11:30 AM - 12:30 PM',
      title: 'Computer Networks',
      room: 'CSE-306 • Room A3',
      status: 'Upcoming',
      isOngoing: false,
      actionText: 'View Details'
    },
    {
      id: 'cs308',
      time: '01:15 PM - 02:15 PM',
      title: 'Software Engineering',
      room: 'CSE-308 • Room A1',
      status: 'Upcoming',
      isOngoing: false,
      actionText: 'View Details'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      
      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#0052cc] via-[#0066ff] to-[#00b4d8] text-white px-6 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Subtle Background Glow and Ambient Circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl pointer-events-none"></div>

        {/* Left Welcome Copy */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/assets/prof_manas.jpg"
            alt={effectiveUserName}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-md shrink-0"
          />
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-heading tracking-tight">
            Welcome Back, {effectiveUserName}! 👋
          </h1>
        </div>

        {/* Right 3D Cap & Glowing Book Graphic */}
        <div className="hidden sm:flex items-center justify-end relative z-10 h-12 md:h-14">
          <img
            src="/assets/grad_cap_book.jpg"
            alt="Academic Cap & Book"
            className="h-full w-auto object-contain drop-shadow-lg rounded-xl transform hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* 2. Four Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm app-card-hover flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0284c7] shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {totalStudents.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Students</div>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm app-card-hover flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {presentToday.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium">Present Today</div>
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm app-card-hover flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ef4444] shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {absentToday}
            </div>
            <div className="text-xs text-slate-500 font-medium">Absent Today</div>
          </div>
        </div>

        {/* Card 4: Total Faculty */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm app-card-hover flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#9333ea] shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {totalFaculty}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Faculty</div>
          </div>
        </div>

      </div>

      {/* 3. Middle Row: Today's Attendance Overview Donut Chart & Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Today's Attendance Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Today's Attendance Overview</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white">
              <span>Today</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-1">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                {/* Present Arc (89.7%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray="389.5"
                  strokeDashoffset="40"
                  strokeLinecap="round"
                />
                {/* Absent Arc (6.8%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="20"
                  strokeDasharray="26.5 363"
                  strokeDashoffset="-350"
                  strokeLinecap="round"
                />
                {/* Not Marked Arc (3.5%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#94a3b8"
                  strokeWidth="20"
                  strokeDasharray="14 375"
                  strokeDashoffset="-380"
                  strokeLinecap="round"
                />
              </svg>

              {/* Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 font-heading">
                  89.7%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Present
                </span>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="w-full sm:w-48 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-600 font-medium">Present</span>
                </div>
                <span className="font-extrabold text-slate-900">{presentToday.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  <span className="text-slate-600 font-medium">Absent</span>
                </div>
                <span className="font-extrabold text-slate-900">{absentToday}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]"></span>
                  <span className="text-slate-600 font-medium">Not Marked</span>
                </div>
                <span className="font-extrabold text-slate-900">{notMarked}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800">Total Students</span>
                <span className="text-slate-900 font-extrabold">{totalStudents.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Attendance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Recent Attendance</h2>
            <button
              onClick={() => onNavigate('records')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentAttendance.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{student.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{student.roll}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-medium hidden sm:block">
                    {student.time}
                  </span>
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#dcfce7] text-[#16a34a]">
                    {student.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Bottom Row: Today's Class Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Today's Class Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Today's Class Schedule</h2>
            <button
              onClick={() => onNavigate('records')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-4 relative">
            {/* Timeline Vertical Connecting Line */}
            <div className="absolute left-[7px] top-3 bottom-5 w-0.5 bg-slate-200 pointer-events-none"></div>

            {scheduleItems.map((item) => (
              <div key={item.id} className="relative flex items-center justify-between pl-6 group">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    item.isOngoing ? 'bg-[#10b981] ring-4 ring-emerald-100' : 'bg-slate-400'
                  }`}
                ></div>

                {/* Class Details */}
                <div className="flex-1 pr-3">
                  <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                    {item.time}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {item.room}
                  </div>
                </div>

                {/* Status Badge & Action Button */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      item.isOngoing
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-[#f1f5f9] text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.isOngoing ? (
                    <button
                      onClick={() => onNavigate('kiosk')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      {item.actionText}
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Details for ${item.title}: Room ${item.room.split('•')[1] || 'A2'}`)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#1877f2] text-[#1877f2] hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {item.actionText}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Actions (2x2 Grid) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Tile 1: Take Attendance */}
            <button
              onClick={() => onNavigate('kiosk')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f0f7ff] hover:bg-[#e3efff] border border-[#e0f0ff] transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0070f3] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Take Attendance
              </div>
            </button>

            {/* Tile 2: Manage Students */}
            <button
              onClick={() => onNavigate('students')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f0fdf4] hover:bg-[#e2fbe9] border border-[#dcfce7] transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-[#16a34a] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Manage Students
              </div>
            </button>

            {/* Tile 3: View Reports */}
            <button
              onClick={() => onNavigate('defaulters')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fef3c7] transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#ea580c] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                View Reports
              </div>
            </button>

            {/* Tile 4: System Settings */}
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#faf5ff] hover:bg-[#f3e8ff] border border-[#f3e8ff] transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-[#9333ea] group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">
                System Settings
              </div>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
