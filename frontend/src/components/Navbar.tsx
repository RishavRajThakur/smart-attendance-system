import React, { useState } from 'react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Format today's date matching design (e.g. "Tue, 30 Sep 2026")
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const isStudent = user?.role === 'student';
  const avatarUrl = isStudent ? '/assets/student_aman.jpg' : '/assets/prof_manas.jpg';
  const displayName = isStudent
    ? (user?.full_name && !user.full_name.includes('Rishav') ? user.full_name : 'Aman Kumar')
    : 'Prof. Manas Ranjan Biswal';

  const notifications = [
    { id: 1, title: 'Attendance Marked', desc: '4 students marked via Face Recognition in CSE-302', time: '10 min ago' },
    { id: 2, title: 'Defaulter Alert', desc: '2 students below 75% attendance threshold', time: '1 hour ago' },
    { id: 3, title: 'System Engine', desc: 'OpenCV & Deep Metric Biometric Cache updated', time: '2 hours ago' },
  ];

  return (
    <header className="h-[70px] bg-white border-b border-slate-100 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between select-none">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onNavigate('students');
              }
            }}
            placeholder="Search students, faculty, or records..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f1f5f9] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-slate-200 transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6 ml-4">
        
        {/* Notification Bell with Badge '3' */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative cursor-pointer"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] font-semibold text-blue-600 cursor-pointer">Mark read</span>
              </div>
              <div className="space-y-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{n.desc}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Display Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateStr}</span>
        </div>

        {/* User Profile Avatar with Caret */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-slate-200"
            />
            <svg className="w-3.5 h-3.5 text-slate-500 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="p-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('settings');
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>System Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 mt-1"
              >
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
