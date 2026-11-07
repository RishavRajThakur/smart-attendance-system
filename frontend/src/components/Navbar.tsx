import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onNavigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut listener to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format today's date matching design (e.g. "Tue, 30 Sep 2026")
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isStudent = user?.role === 'student';

  const notifications = [
    { id: 1, title: 'Attendance Marked', desc: '4 students marked via Face Recognition in CSE-302', time: '10 min ago' },
    { id: 2, title: 'Defaulter Alert', desc: '2 students below 75% attendance threshold', time: '1 hour ago' },
    { id: 3, title: 'Biometrics Active', desc: 'Face recognition database synchronized', time: '2 hours ago' },
  ];

  return (
    <header className="h-[70px] bg-white border-b border-slate-100 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between select-none">
      {/* Search Input Bar with clean border and Ctrl+K badge */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onNavigate(isStudent ? 'records' : 'students');
              }
            }}
            placeholder={isStudent ? "Search attendance records..." : "Search students, faculty, or records..."}
            className="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-50/80 hover:bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 shadow-xs transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        
        {/* Notification Bell with Badge '3' & polished border */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-blue-600 flex items-center justify-center transition shadow-xs cursor-pointer relative"
            title="Notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-tr from-rose-600 to-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">3</span>
                </div>
                <button className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Mark read</button>
              </div>
              <div className="space-y-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.desc}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date & Time Display Box with clean border */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs font-semibold text-slate-700 bg-slate-50/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition">
          <div className="flex items-center gap-1.5 text-slate-700">
            <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{dateStr}</span>
          </div>
          <span className="w-px h-3.5 bg-slate-200" />
          <div className="flex items-center gap-1.5 font-mono text-slate-500 font-medium">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeStr}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
