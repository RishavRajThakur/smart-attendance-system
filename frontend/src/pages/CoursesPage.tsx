import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { Course, FacultyMember } from '../types';

interface CoursesPageProps {
  onNavigate: (page: string) => void;
  userRole?: string;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onNavigate, userRole = 'admin' }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(7);
  const [assignedFacultyId, setAssignedFacultyId] = useState<number | ''>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, fData] = await Promise.all([
        api.getCourses(),
        isAdmin ? api.getFaculty().catch(() => []) : Promise.resolve([])
      ]);
      setCourses(cData);
      setFacultyList(fData);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setCourseCode('');
    setCourseName('');
    setDepartment('Computer Science');
    setSemester(7);
    setAssignedFacultyId('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseCode(c.course_code);
    setCourseName(c.course_name);
    setDepartment(c.department);
    setSemester(c.semester);
    setAssignedFacultyId(c.faculty_id || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          course_name: courseName.trim(),
          department,
          semester,
          faculty_id: assignedFacultyId ? Number(assignedFacultyId) : null
        });
      } else {
        await api.createCourse({
          course_code: courseCode.trim().toUpperCase(),
          course_name: courseName.trim(),
          department,
          semester,
          faculty_id: assignedFacultyId ? Number(assignedFacultyId) : undefined
        });
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (c: Course) => {
    if (!confirm(`Are you sure you want to delete course ${c.course_code}: ${c.course_name}?`)) return;
    try {
      await api.deleteCourse(c.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.faculty_name && c.faculty_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 font-heading">Subjects & Courses</h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {courses.length} Courses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search subjects or faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-52"
          />

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Courses */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading academic subjects...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
          No courses matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {course.course_code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 font-heading mt-2">{course.course_name}</h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {course.department} • Semester {course.semester}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-lg">
                    {course.total_classes} Classes Held
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Faculty:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>{course.faculty_name || 'Unassigned'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onNavigate('kiosk')}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Take Attendance</span>
                  <span>&rarr;</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Edit / Reassign
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative">
            <h2 className="text-base font-bold text-slate-900 font-heading mb-1">
              {editingCourse ? 'Edit Academic Subject' : 'Add New Academic Subject'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Configure course details and assign the responsible faculty member.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!editingCourse && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS705"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Robotics"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value) || 7)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Faculty Instructor</label>
                <select
                  value={assignedFacultyId}
                  onChange={(e) => setAssignedFacultyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.full_name} ({f.email})
                    </option>
                  ))}
                </select>
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
                  {formLoading ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
