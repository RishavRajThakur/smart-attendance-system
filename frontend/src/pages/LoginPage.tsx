import React, { useState } from 'react';
import { api } from '../api';
import { BrandLogo } from '../components/BrandLogo';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

type RoleType = 'admin' | 'faculty' | 'student';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<RoleType>('admin');

  // Input states per role for convenience
  const [adminEmail, setAdminEmail] = useState('admin@college.edu');
  const [adminPassword, setAdminPassword] = useState('admin123');

  const [facultyEmail, setFacultyEmail] = useState('faculty@college.edu');
  const [facultyPassword, setFacultyPassword] = useState('faculty123');

  const [studentRoll, setStudentRoll] = useState('2103001');
  const [studentPassword, setStudentPassword] = useState('student123');

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    let identifier = '';
    let pass = '';

    if (tab === 'admin') {
      identifier = adminEmail.trim();
      pass = adminPassword;
    } else if (tab === 'faculty') {
      identifier = facultyEmail.trim();
      pass = facultyPassword;
    } else {
      identifier = studentRoll.trim();
      pass = studentPassword;
    }

    try {
      const res = await api.login(identifier, pass, tab);
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setRoleTab = (newTab: RoleType) => {
    setTab(newTab);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Soft Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-blue-400/10 via-cyan-400/10 to-indigo-400/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-[460px] relative z-10">
        <div className="bg-white rounded-[26px] p-7 sm:p-8 login-frame-border relative overflow-hidden shadow-xl">
          
          {/* Top Brand Logo */}
          <div className="mb-6">
            <BrandLogo size="lg" subtitle="Smart Student Face Attendance System" theme="light" />
          </div>

          {/* EXACT THREE USER ROLES SELECTOR: 1. Admin, 2. Faculty, 3. Student */}
          <div className="flex rounded-2xl bg-[#f1f5f9] p-1.5 mb-5 border border-slate-200/70 gap-1">
            {/* 1. Admin Option */}
            <button
              type="button"
              id="login-tab-admin"
              onClick={() => setRoleTab('admin')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'admin'
                  ? 'bg-gradient-to-r from-[#1877f2] to-[#0d5ac9] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              <span>Admin</span>
            </button>

            {/* 2. Faculty Option */}
            <button
              type="button"
              id="login-tab-faculty"
              onClick={() => setRoleTab('faculty')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'faculty'
                  ? 'bg-gradient-to-r from-[#1877f2] to-[#0d5ac9] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Faculty</span>
            </button>

            {/* 3. Student Option */}
            <button
              type="button"
              id="login-tab-student"
              onClick={() => setRoleTab('student')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'student'
                  ? 'bg-gradient-to-r from-[#1877f2] to-[#0d5ac9] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <span>Student</span>
            </button>

            {/* 4. KIIT SAP Option */}
            <a
              href="https://kiit.ac.in/sap/"
              target="_blank"
              rel="noopener noreferrer"
              id="login-tab-kiit-sap"
              className="flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-white/50"
              title="Open KIIT SAP Portal"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>KIIT SAP</span>
            </a>
          </div>



          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Input Identifier based on active Tab */}
            {tab === 'admin' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Administrator Email / ID</label>
                <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {tab === 'faculty' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Faculty ID / Email</label>
                <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    placeholder="faculty@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {tab === 'student' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Student Roll Number / ID</label>
                <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                    placeholder="e.g. 2103001 or 2021CSE042"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Password</label>
              <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={tab === 'admin' ? adminPassword : tab === 'faculty' ? facultyPassword : studentPassword}
                  onChange={(e) => {
                    if (tab === 'admin') setAdminPassword(e.target.value);
                    else if (tab === 'faculty') setFacultyPassword(e.target.value);
                    else setStudentPassword(e.target.value);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Demo Creds Helper */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Remember session</span>
              </label>

              {/* Demo Helper Button */}
              <button
                type="button"
                onClick={() => {
                  if (tab === 'admin') {
                    setAdminEmail('admin@college.edu');
                    setAdminPassword('admin123');
                  } else if (tab === 'faculty') {
                    setFacultyEmail('faculty@college.edu');
                    setFacultyPassword('faculty123');
                  } else {
                    setStudentRoll('2103001');
                    setStudentPassword('student123');
                  }
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
              >
                Auto-fill demo credentials
              </button>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide bg-gradient-to-r from-[#0080ff] to-[#0052d4] hover:from-[#0070e0] hover:to-[#0047b8] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating as {tab.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <span>
                    {tab === 'admin' && 'Login as Administrator'}
                    {tab === 'faculty' && 'Login as Faculty'}
                    {tab === 'student' && 'Login as Student'}
                  </span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>


          </form>

          {/* Quick Demo Reference Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-7 -mb-7 sm:-mx-8 sm:-mb-8 p-4 text-[11px] text-slate-500 rounded-b-[26px]">
            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <span>Quick Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div 
                onClick={() => { setRoleTab('admin'); setAdminEmail('admin@college.edu'); setAdminPassword('admin123'); }}
                className="p-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-blue-400 cursor-pointer transition"
              >
                <div className="font-bold text-slate-800">Admin</div>
                <div className="text-slate-500 truncate">admin@college.edu</div>
                <div className="text-slate-400 font-mono">admin123</div>
              </div>
              <div 
                onClick={() => { setRoleTab('faculty'); setFacultyEmail('faculty@college.edu'); setFacultyPassword('faculty123'); }}
                className="p-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-blue-400 cursor-pointer transition"
              >
                <div className="font-bold text-slate-800">Faculty</div>
                <div className="text-slate-500 truncate">faculty@college.edu</div>
                <div className="text-slate-400 font-mono">faculty123</div>
              </div>
              <div 
                onClick={() => { setRoleTab('student'); setStudentRoll('2103001'); setStudentPassword('student123'); }}
                className="p-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-blue-400 cursor-pointer transition"
              >
                <div className="font-bold text-slate-800">Student</div>
                <div className="text-slate-500 truncate">2103001</div>
                <div className="text-slate-400 font-mono">student123</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
