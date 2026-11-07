import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { AnalyticsOverview, Course, User } from '../types';
import { getUserAvatar, handleAvatarError, DEFAULT_AVATAR } from '../utils/avatar';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  userName?: string;
  userRole?: string;
  currentUser?: User | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  userName = 'User',
  userRole = 'faculty',
  currentUser
}) => {
  const isAdmin = userRole === 'admin';
  const effectiveUserName = userName || (isAdmin ? 'System Administrator' : 'Faculty Member');
  const avatarUrl = getUserAvatar(currentUser, userRole);
  const roleSubtitle = isAdmin
    ? 'System Administration Portal'
    : 'Faculty Portal • Computer Science & Engineering';

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [userRole]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [overview, coursesData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getCourses().catch(() => [])
      ]);
      setData(overview);
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Real statistics strictly derived from actual database records
  const totalStudents = data?.total_students ?? 0;
  const presentToday = data?.present_today ?? 0;
  const absentToday = data?.absent_today ?? 0;
  const notMarked = data?.not_marked_today ?? Math.max(0, totalStudents - presentToday - absentToday);
  const totalFaculty = data?.total_faculty ?? (data?.total_courses ?? courses.length);

  const hasActivityToday = (presentToday + absentToday) > 0;
  const computedRate = hasActivityToday && totalStudents > 0
    ? Math.round((presentToday / totalStudents) * 100 * 10) / 10
    : (data?.overall_attendance_rate ?? 0);
  const attendanceRate = totalStudents > 0 ? `${computedRate}%` : '0%';

  // Donut Arc calculation
  const CIRCUMFERENCE = 389.56; // 2 * Math.PI * 62
  const presentDash = totalStudents > 0 ? (presentToday / totalStudents) * CIRCUMFERENCE : 0;
  const absentDash = totalStudents > 0 ? (absentToday / totalStudents) * CIRCUMFERENCE : 0;

  // Real recent attendance records from API
  const recentList = data?.recent_records || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">

      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#0052cc] via-[#0066ff] to-[#00b4d8] text-white px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Subtle Background Glow and Ambient Circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl pointer-events-none"></div>

        {/* Left Welcome Copy */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src={avatarUrl}
            alt={effectiveUserName}
            onError={(e) => handleAvatarError(e, userRole)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
          />
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-heading tracking-tight">
              Welcome Back, {effectiveUserName}! 👋
            </h1>
            <p className="text-xs text-blue-100 font-medium mt-0.5">
              {roleSubtitle}
            </p>
          </div>
        </div>

        {/* Right Quick Links */}
        <div className="hidden sm:flex items-center gap-3 relative z-10">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('faculty')}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer backdrop-blur-xs"
              >
                Manage Faculty
              </button>
              <button
                onClick={() => onNavigate('courses')}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer backdrop-blur-xs"
              >
                Manage Subjects
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('kiosk')}
              className="px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition cursor-pointer"
            >
              Take Attendance &rarr;
            </button>
          )}
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

        {/* Card 4: Total Faculty (Admin) / My Courses (Faculty) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm app-card-hover flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#9333ea] shrink-0">
            {isAdmin ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading leading-tight">
              {isAdmin ? totalFaculty : (data?.total_courses || courses.length)}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {isAdmin ? 'Total Faculty' : 'Assigned Courses'}
            </div>
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
                {/* Present Arc */}
                {presentDash > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${presentDash} ${CIRCUMFERENCE - presentDash}`}
                    strokeDashoffset={0}
                    strokeLinecap={presentToday === totalStudents ? 'butt' : 'round'}
                  />
                )}
                {/* Absent Arc */}
                {absentDash > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${absentDash} ${CIRCUMFERENCE - absentDash}`}
                    strokeDashoffset={-presentDash}
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 font-heading">
                  {attendanceRate}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {hasActivityToday ? 'Turnout Today' : 'Attendance Rate'}
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
            {recentList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No attendance marked today yet.
              </div>
            ) : (
              recentList.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.student_photo || DEFAULT_AVATAR}
                      alt={student.student_name}
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{student.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{student.student_roll}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 font-medium hidden sm:block">
                      {new Date(student.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${student.status === 'PRESENT'
                      ? 'bg-[#dcfce7] text-[#16a34a]'
                      : student.status === 'LATE'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-rose-50 text-rose-600'
                      }`}>
                      {student.status === 'PRESENT' ? 'Present' : student.status === 'LATE' ? 'Late' : 'Absent'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. Bottom Row: Today's Class Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Today's Class Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Academic Classes & Subjects</h2>
            <button
              onClick={() => onNavigate(isAdmin ? 'courses' : 'records')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5">
            {courses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No courses currently registered.
              </div>
            ) : (
              courses.slice(0, 4).map((c, idx) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] hover:bg-slate-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {c.course_code.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.course_name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {c.course_code} • {c.faculty_name || 'Faculty Assigned'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(isAdmin ? 'courses' : 'kiosk')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isAdmin ? 'Manage' : 'Take Attendance'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Actions (2x2 Grid) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="pb-2 mb-2 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Tile 1: Manage Faculty (Admin) / Take Attendance (Faculty) */}
            {isAdmin ? (
              <button
                onClick={() => onNavigate('faculty')}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#f0f7ff] hover:bg-[#e3efff] border border-[#e0f0ff] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0070f3] group-hover:scale-105 transition-transform shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Manage Faculty
                </div>
              </button>
            ) : (
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
            )}

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
                {isAdmin ? 'Student Registry' : 'My Students'}
              </div>
            </button>

            {/* Tile 3: Reports & Defaulters */}
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
                Attendance Defaulters
              </div>
            </button>

            {/* Tile 4: System Settings (Admin) / Attendance Records (Faculty) */}
            {isAdmin ? (
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
            ) : (
              <button
                onClick={() => onNavigate('records')}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#faf5ff] hover:bg-[#f3e8ff] border border-[#f3e8ff] transition-all text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-[#9333ea] group-hover:scale-105 transition-transform shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Attendance Records
                </div>
              </button>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
