import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { FacultyMember, Course, User } from '../types';
import { getUserAvatar, handleAvatarError } from '../utils/avatar';

interface FacultyPageProps {
  onNavigate: (page: string) => void;
  userRole?: string;
  currentUser?: User | null;
}

export const FacultyPage: React.FC<FacultyPageProps> = ({
  onNavigate,
  userRole = 'faculty',
  currentUser
}) => {
  const isAdmin = userRole === 'admin';

  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals for Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  // Form states for Add / Edit Faculty
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Password reset modal state
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [credsSuccess, setCredsSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadFacultyData();
  }, [userRole]);

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [facData, coursesData] = await Promise.all([
        api.getFaculty(),
        api.getCourses().catch(() => [])
      ]);
      setFacultyMembers(facData);
      setCourses(coursesData);
    } catch (err: any) {
      console.error('Failed to load faculty', err);
      setError(err.message || 'Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFullName('');
    setEmail('');
    setPassword('faculty123');
    setDepartment('Computer Science & Engineering');
    setDesignation('Assistant Professor');
    setPhone('');
    setSelectedCourseIds([]);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await api.createFaculty({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        department: department.trim(),
        designation: designation.trim(),
        phone: phone.trim() || undefined,
        course_ids: selectedCourseIds
      });
      setShowAddModal(false);
      loadFacultyData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenCredsModal = (fac: FacultyMember) => {
    setSelectedFaculty(fac);
    setNewEmail(fac.email);
    setNewPassword('');
    setCredsSuccess(null);
    setFormError(null);
    setShowCredsModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setFormLoading(true);
    setFormError(null);
    setCredsSuccess(null);

    try {
      // 1. If email changed, update email
      if (newEmail.trim() !== selectedFaculty.email) {
        await api.updateFaculty(selectedFaculty.id, {
          email: newEmail.trim()
        });
      }

      // 2. If password provided, reset password
      if (newPassword.trim()) {
        const res = await api.resetFacultyPassword(selectedFaculty.id, newPassword.trim());
        setCredsSuccess(res.message || 'Password successfully updated!');
      } else if (newEmail.trim() !== selectedFaculty.email) {
        setCredsSuccess('Faculty User ID (email) updated successfully!');
      } else {
        setFormError('Please enter a new password or change User ID.');
        setFormLoading(false);
        return;
      }

      setNewPassword('');
      loadFacultyData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update credentials');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFaculty = async (fac: FacultyMember) => {
    if (fac.role === 'admin' || fac.email === 'admin@college.edu') {
      alert('Administrator accounts cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete faculty member ${fac.full_name}?`)) return;

    try {
      await api.deleteFaculty(fac.id);
      loadFacultyData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty');
    }
  };

  const toggleCourseSelect = (id: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // ==========================================
  // VIEW 1: RESTRICTED FACULTY SELF-VIEW
  // (Faculty can only view their own info, NOT other faculty)
  // ==========================================
  if (!isAdmin) {
    const myProfile = facultyMembers[0];

    return (
      <div className="space-y-6 max-w-7xl mx-auto select-none">
        {/* Top Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">My Faculty Profile & Subjects</h1>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Faculty Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('kiosk')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Take Attendance</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading your faculty profile...</div>
        ) : myProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Faculty ID & Bio */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={getUserAvatar(currentUser, 'faculty')}
                    alt={myProfile.full_name}
                    onError={(e) => handleAvatarError(e, 'faculty')}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100 shadow-md"
                  />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-heading">{myProfile.full_name}</h2>
                    <div className="text-xs text-blue-600 font-semibold">{myProfile.designation}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{myProfile.department}</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Faculty User ID (Email):</span>
                    <span className="font-mono font-bold text-slate-900">{myProfile.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Role:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 uppercase">
                      {myProfile.role}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Department:</span>
                    <span className="font-semibold text-slate-900">{myProfile.department}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Status:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active Instructor
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Total Sessions Held:</span>
                    <span className="font-bold text-slate-900">{myProfile.total_sessions}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => onNavigate('students')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>View My Enrolled Students</span>
                </button>
              </div>
            </div>

            {/* Right Card: Assigned Subjects & Teaching Responsibilities */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-heading">My Assigned Academic Subjects</h2>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {myProfile.assigned_courses.length} Assigned
                  </span>
                </div>

                <div className="space-y-3">
                  {myProfile.assigned_courses.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No subjects currently assigned. Please contact the administrator.
                    </div>
                  ) : (
                    myProfile.assigned_courses.map((courseStr, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-100 bg-[#f8fafc] hover:bg-slate-50 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 font-bold flex items-center justify-center text-xs">
                            CS
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{courseStr}</div>
                            <div className="text-[11px] text-slate-500">7th Semester • Computer Science & Engineering</div>
                          </div>
                        </div>

                        <button
                          onClick={() => onNavigate('kiosk')}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Take Attendance &rarr;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500">
                <button
                  onClick={() => onNavigate('records')}
                  className="text-blue-600 hover:underline font-bold"
                >
                  View Attendance Records &rarr;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">Profile information unavailable.</div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ADMIN FULL FACULTY MANAGEMENT
  // (Admin has complete authority: view all, add, reset credentials)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 font-heading">Faculty Management</h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Faculty</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Registered Faculty</div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">{facultyMembers.length}</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">Active</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Assigned Academic Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">{courses.length} Active</div>
          </div>
          <button
            onClick={() => onNavigate('courses')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            View Courses &rarr;
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Credential Management</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">Active Credentials</div>
          </div>
          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🔑
          </span>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading faculty roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {facultyMembers.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={fac.photo_url || getUserAvatar(null, 'faculty')}
                    alt={fac.full_name}
                    onError={(e) => handleAvatarError(e, 'faculty')}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <span className="truncate">{fac.full_name}</span>
                      {fac.role === 'admin' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Admin</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{fac.designation}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                  <div className="text-slate-500">
                    <strong className="text-slate-700">Login ID / Email:</strong>{' '}
                    <span className="font-mono text-slate-900 font-medium">{fac.email}</span>
                  </div>
                  <div className="text-slate-500">
                    <strong className="text-slate-700">Department:</strong> {fac.department}
                  </div>
                  {fac.phone && (
                    <div className="text-slate-500">
                      <strong className="text-slate-700">Contact:</strong> {fac.phone}
                    </div>
                  )}
                  <div>
                    <div className="text-slate-700 font-bold mb-1">Courses Taught:</div>
                    {fac.assigned_courses && fac.assigned_courses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {fac.assigned_courses.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No courses assigned yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Actions on Faculty */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {/* Reset / Change Password Button */}
                <button
                  onClick={() => handleOpenCredsModal(fac)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition flex items-center gap-1 cursor-pointer border border-amber-200"
                  title="Change/Reset Login Credentials"
                >
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Reset Creds</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNavigate('kiosk')}
                    className="text-blue-600 hover:text-blue-700 font-bold text-xs"
                  >
                    Kiosk &rarr;
                  </button>

                  {fac.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteFaculty(fac)}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Faculty Member"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add New Faculty */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative">
            <h2 className="text-base font-bold text-slate-900 font-heading mb-1">Register New Faculty Member</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a new faculty account, set initial login credentials, and assign academic courses.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Prof. Priya Saxena"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty ID / Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya.saxena@college.edu"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="faculty123"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Courses / Subjects</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {courses.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCourseIds.includes(c.id)}
                        onChange={() => toggleCourseSelect(c.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{c.course_code}: {c.course_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manage / Reset Faculty Credentials (Requirement 2) */}
      {showCredsModal && selectedFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                🔑
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Manage Credentials for {selectedFaculty.full_name}
                </h2>
                <div className="text-xs text-slate-500">Admin Authority to Reset Passwords & User IDs</div>
              </div>
            </div>

            {credsSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{credsSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty User ID / Login Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  You can update this faculty member's login identifier directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Set New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (e.g. faculty123)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to keep existing password unchanged.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCredsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Save & Reset Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
