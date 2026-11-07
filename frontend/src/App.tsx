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
import { CoursesPage } from './pages/CoursesPage';
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
      roll_number: userData.roll_number || (userData.role === 'student' ? (userData.email.split('@')[0] || '2103001') : undefined),
      full_name: userData.full_name || (
        userData.role === 'admin'
          ? 'System Administrator'
          : userData.role === 'faculty'
          ? 'Faculty Member'
          : 'Student'
      ),
      role: userData.role,
      department: userData.department,
      designation: userData.designation,
      photo_url: userData.photo_url
    };
    setCurrentUser(user);
    if (user.role === 'student') {
      setCurrentPage('student-portal');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
        <p className="mt-4 text-xs font-semibold text-slate-500">Initializing Smart Attendance System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const displayName = currentUser.full_name || (
    currentUser.role === 'admin'
      ? 'System Administrator'
      : currentUser.role === 'faculty'
      ? 'Faculty Member'
      : 'Student'
  );

  // Strict role-based page authorization
  let effectivePage = currentPage;
  if (currentUser.role === 'student') {
    // Students can ONLY access personal attendance portal, their records, or profile settings
    if (currentPage !== 'student-portal' && currentPage !== 'records' && currentPage !== 'settings') {
      effectivePage = 'student-portal';
    }
  } else if (currentUser.role === 'admin') {
    // Admin cannot take attendance (kiosk is faculty-only) or access student-portal
    if (currentPage === 'kiosk' || currentPage === 'student-portal') {
      effectivePage = 'dashboard';
    }
  } else if (currentUser.role === 'faculty') {
    // Faculty cannot access global curriculum courses creation or student portal
    if (currentPage === 'courses' || currentPage === 'student-portal') {
      effectivePage = 'dashboard';
    }
  }

  const studentRoll = currentUser.roll_number || (currentUser.email.split('@')[0] || '2103001');

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] text-slate-800">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        currentPage={effectivePage}
        onNavigate={setCurrentPage}
        userRole={currentUser.role}
        userName={displayName}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Right Main Column (Header + Scrollable Body) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Navbar
          user={{ ...currentUser, full_name: displayName }}
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
          currentPage={effectivePage}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f8fafc]">
          {effectivePage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              userName={displayName}
              userRole={currentUser.role}
              currentUser={currentUser}
            />
          )}
          {effectivePage === 'kiosk' && (
            <LiveKioskPage onNavigate={setCurrentPage} userRole={currentUser.role} />
          )}
          {effectivePage === 'students' && <StudentRegistryPage userRole={currentUser.role} />}
          {effectivePage === 'faculty' && (
            <FacultyPage onNavigate={setCurrentPage} userRole={currentUser.role} currentUser={currentUser} />
          )}
          {effectivePage === 'courses' && (
            <CoursesPage onNavigate={setCurrentPage} userRole={currentUser.role} />
          )}
          {effectivePage === 'records' && <AttendanceRecordsPage userRole={currentUser.role} />}
          {effectivePage === 'defaulters' && <DefaultersPage />}
          {effectivePage === 'settings' && (
            <SettingsPage
              onNavigate={setCurrentPage}
              currentUser={currentUser}
              userRole={currentUser.role}
              onUserUpdate={handleUserUpdate}
            />
          )}
          {effectivePage === 'student-portal' && (
            <StudentPortalPage
              initialRoll={studentRoll}
              userRole={currentUser.role}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
