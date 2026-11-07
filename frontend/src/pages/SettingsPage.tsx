import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { api } from '../api';
import { getUserAvatar, handleAvatarError } from '../utils/avatar';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  currentUser?: User | null;
  userRole?: string;
  onUserUpdate?: (user: User) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  currentUser,
  userRole = 'admin',
  onUserUpdate
}) => {
  const isAdmin = userRole === 'admin';
  const isFaculty = userRole === 'faculty';
  const isStudent = userRole === 'student';

  const [matchThreshold, setMatchThreshold] = useState(0.65);
  const [defaulterThreshold, setDefaulterThreshold] = useState(75);
  const [duplicateLockMinutes, setDuplicateLockMinutes] = useState(45);
  const [enableChime, setEnableChime] = useState(true);
  const [saved, setSaved] = useState(false);

  // Profile Photo Management State
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoMessage({ text: 'Please select a valid image file (JPG, PNG, WebP).', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage({ text: 'Image file size should be less than 5MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setPhotoLoading(true);
        setPhotoMessage(null);
        const res = await api.uploadProfilePhoto(base64);
        if (res.photo_url && currentUser) {
          const updated = { ...currentUser, photo_url: res.photo_url };
          onUserUpdate?.(updated);
          setPhotoMessage({ text: 'Profile photo updated successfully.', type: 'success' });
          setTimeout(() => setPhotoMessage(null), 3500);
        }
      } catch (err: any) {
        setPhotoMessage({ text: err.message || 'Failed to update profile photo.', type: 'error' });
      } finally {
        setPhotoLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo and use the default avatar?')) return;
    try {
      setPhotoLoading(true);
      setPhotoMessage(null);
      await api.removeProfilePhoto();
      if (currentUser) {
        const updated = { ...currentUser, photo_url: undefined };
        onUserUpdate?.(updated);
        setPhotoMessage({ text: 'Profile photo removed. Default avatar restored.', type: 'success' });
        setTimeout(() => setPhotoMessage(null), 3500);
      }
    } catch (err: any) {
      setPhotoMessage({ text: err.message || 'Failed to remove profile photo.', type: 'error' });
    } finally {
      setPhotoLoading(false);
    }
  };

  const currentAvatar = getUserAvatar(currentUser, userRole);

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">
            {isAdmin ? 'System Settings' : isFaculty ? 'Faculty Settings' : 'Student Settings'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'System configuration and account preferences' : 'Profile and preferences'}
          </p>
        </div>
        <button
          onClick={() => onNavigate(isStudent ? 'student-portal' : 'dashboard')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          &larr; Back to {isStudent ? 'Portal' : 'Dashboard'}
        </button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Settings updated successfully.</span>
        </div>
      )}

      {/* --- PROFILE PHOTO MANAGEMENT CARD (Available to Admin, Faculty, and Student) --- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Profile Photo</h2>
            <p className="text-xs text-slate-400">Manage your personal account photo</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            currentUser?.photo_url
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {currentUser?.photo_url ? 'Custom Photo Active' : 'Default Avatar'}
          </span>
        </div>

        {photoMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            photoMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span>{photoMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <img
              src={currentAvatar}
              alt="Profile"
              onError={(e) => handleAvatarError(e, userRole)}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
            />
            {photoLoading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* User Details & Action Controls */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <div className="text-sm font-bold text-slate-900">{currentUser?.full_name}</div>
              <div className="text-xs text-slate-500 font-mono">
                {currentUser?.email || currentUser?.roll_number}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{currentUser?.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {currentUser?.photo_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={photoLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- ADMIN VIEW --- */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Facial Recognition Parameters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Face Recognition Settings</h2>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700">Recognition Threshold</label>
                  <span className="font-mono font-bold text-blue-600">{(matchThreshold * 100).toFixed(0)}% ({matchThreshold})</span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="0.90"
                  step="0.05"
                  value={matchThreshold}
                  onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700">Anti-Duplicate Window</label>
                  <span className="font-mono font-bold text-blue-600">{duplicateLockMinutes} Minutes</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={duplicateLockMinutes}
                  onChange={(e) => setDuplicateLockMinutes(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Card 2: Attendance Compliance Rule */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Attendance Minimum Threshold</h2>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700">Statutory Percentage</label>
                  <span className="font-mono font-bold text-emerald-600">{defaulterThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="85"
                  step="1"
                  value={defaulterThreshold}
                  onChange={(e) => setDefaulterThreshold(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="font-bold text-slate-800">Database Engine:</div>
                <div className="text-slate-600 font-medium">SQLite (attendance.db)</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setMatchThreshold(0.65);
                setDefaulterThreshold(75);
                setDuplicateLockMinutes(45);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </>
      )}

      {/* --- FACULTY VIEW --- */}
      {isFaculty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Faculty Identification */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Faculty Details</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900">{currentUser?.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Email</span>
                <span className="font-mono font-bold text-blue-600">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{currentUser?.department || 'Computer Science'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Designation</span>
                <span className="font-semibold text-slate-800">{currentUser?.designation || 'Assistant Professor'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Scanner Preferences */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Attendance Preferences</h2>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-800">Audio Verification Chime</div>
                  <div className="text-[11px] text-slate-400">Play chime upon facial identification</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableChime}
                  onChange={(e) => setEnableChime(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* --- STUDENT VIEW --- */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Student Identification */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Student Record</h2>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Student Name</span>
                <span className="font-bold text-slate-900">{currentUser?.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Roll Number</span>
                <span className="font-mono font-bold text-blue-600">{currentUser?.roll_number || currentUser?.email?.split('@')[0]}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{currentUser?.department || 'Computer Science'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-800">Enrolled Student</span>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Links */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Attendance Portal</h2>
              </div>
            </div>

            <div className="space-y-3.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-800">Face Attendance Status</span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  Active
                </span>
              </div>

              <button
                onClick={() => onNavigate('student-portal')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer text-center"
              >
                View My Attendance Percentage &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
