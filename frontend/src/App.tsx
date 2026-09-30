import React, { useState, useEffect } from 'react';
import { api } from './api';
import type { User } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveKioskPage } from './pages/LiveKioskPage';
import { StudentRegistryPage } from './pages/StudentRegistryPage';
import { FacultyPage } from './pages/FacultyPage';
import { AttendanceRecordsPage } from './pages/AttendanceRecordsPage';
import { DefaultersPage } from './pages/DefaultersPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentPortalPage } from './pages/StudentPortalPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved session
    const savedUser = api.getCurrentUser();
    if (savedUser) {
      if (savedUser.role !== 'student' || !savedUser.full_name || savedUser.full_name.includes('Rishav')) {
        savedUser.full_name = 'Prof. Manas Ranjan Biswal';
        localStorage.setItem('user', JSON.stringify(savedUser));
      }
      setCurrentUser(savedUser);
      if (savedUser.role === 'student') {
        setCurrentPage('student-portal');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    const user: User = {
      id: userData.user_id,
      email: userData.email,
      full_name: userData.role === 'student' ? (userData.full_name || 'Aman Kumar') : 'Prof. Manas Ranjan Biswal',
      role: userData.role,
    };
    setCurrentUser(user);
    if (user.role === 'student') {
      setCurrentPage('student-portal');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Initializing SmartAttend System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const displayName =
    currentUser.role === 'student'
      ? (currentUser.full_name && !currentUser.full_name.includes('Rishav') ? currentUser.full_name : 'Aman Kumar')
      : 'Prof. Manas Ranjan Biswal';

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] text-slate-800">
      {/* 1. Left Fixed Sidebar (Full Height Matching Image 2) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userRole={currentUser.role}
        userName={displayName}
        onLogout={handleLogout}
      />

      {/* 2. Right Main Column (Header + Scrollable Body) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Navbar
          user={{ ...currentUser, full_name: displayName }}
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f8fafc]">
          {currentPage === 'dashboard' && (
            <DashboardPage onNavigate={setCurrentPage} userName={displayName} />
          )}
          {currentPage === 'kiosk' && <LiveKioskPage />}
          {currentPage === 'students' && <StudentRegistryPage />}
          {currentPage === 'faculty' && <FacultyPage onNavigate={setCurrentPage} />}
          {currentPage === 'records' && <AttendanceRecordsPage />}
          {currentPage === 'defaulters' && <DefaultersPage />}
          {currentPage === 'settings' && <SettingsPage onNavigate={setCurrentPage} />}
          {currentPage === 'student-portal' && (
            <StudentPortalPage
              initialRoll={currentUser.role === 'student' ? (currentUser.email.split('@')[0] || '2103001') : '2103001'}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
