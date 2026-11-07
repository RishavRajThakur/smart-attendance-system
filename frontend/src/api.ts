import type {
  User, Student, AttendanceSession, AttendanceRecord,
  AnalyticsOverview, DefaulterStudent, RecognizedFace,
  FacultyMember, Course
} from './types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // --- Auth ---
  async login(
    email: string,
    password: string,
    role?: string
  ): Promise<{ access_token: string; role: 'admin' | 'faculty' | 'student'; full_name: string; email: string; roll_number?: string; department?: string; designation?: string; photo_url?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Authentication failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async uploadProfilePhoto(photo_base64: string): Promise<{ success: boolean; photo_url: string }> {
    const res = await fetch(`${API_BASE}/auth/profile-photo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ photo_base64 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload photo' }));
      throw new Error(err.detail || 'Failed to upload photo');
    }
    return res.json();
  },

  async removeProfilePhoto(): Promise<{ success: boolean; photo_url: null }> {
    const res = await fetch(`${API_BASE}/auth/profile-photo`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to remove photo' }));
      throw new Error(err.detail || 'Failed to remove photo');
    }
    return res.json();
  },

  // --- Faculty Management ---
  async getFaculty(): Promise<FacultyMember[]> {
    const res = await fetch(`${API_BASE}/faculty`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load faculty' }));
      throw new Error(err.detail || 'Failed to load faculty');
    }
    return res.json();
  },

  async getMyFacultyProfile(): Promise<FacultyMember> {
    const res = await fetch(`${API_BASE}/faculty/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load faculty profile');
    return res.json();
  },

  async createFaculty(data: {
    email: string;
    password: string;
    full_name: string;
    department?: string;
    designation?: string;
    phone?: string;
    course_ids?: number[];
  }): Promise<FacultyMember> {
    const res = await fetch(`${API_BASE}/faculty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create faculty' }));
      throw new Error(err.detail || 'Failed to create faculty');
    }
    return res.json();
  },

  async updateFaculty(id: number, data: {
    email?: string;
    full_name?: string;
    department?: string;
    designation?: string;
    phone?: string;
    course_ids?: number[];
  }): Promise<FacultyMember> {
    const res = await fetch(`${API_BASE}/faculty/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update faculty' }));
      throw new Error(err.detail || 'Failed to update faculty');
    }
    return res.json();
  },

  async resetFacultyPassword(id: number, new_password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/faculty/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to reset password' }));
      throw new Error(err.detail || 'Failed to reset password');
    }
    return res.json();
  },

  async deleteFaculty(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/faculty/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete faculty' }));
      throw new Error(err.detail || 'Failed to delete faculty');
    }
    return res.json();
  },

  // --- Courses / Subjects ---
  async getCourses(department?: string, semester?: number): Promise<Course[]> {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester.toString());
    const res = await fetch(`${API_BASE}/courses?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load courses');
    return res.json();
  },

  async createCourse(data: {
    course_code: string;
    course_name: string;
    department?: string;
    semester?: number;
    faculty_id?: number;
  }): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create course' }));
      throw new Error(err.detail || 'Failed to create course');
    }
    return res.json();
  },

  async updateCourse(id: number, data: {
    course_name?: string;
    department?: string;
    semester?: number;
    faculty_id?: number | null;
  }): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update course' }));
      throw new Error(err.detail || 'Failed to update course');
    }
    return res.json();
  },

  async deleteCourse(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete course');
    return res.json();
  },

  // --- Students ---
  async getStudents(search?: string, department?: string, semester?: number, section?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester.toString());
    if (section) params.append('section', section);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load students');
    return res.json();
  },

  async registerStudent(data: {
    roll_number: string;
    full_name: string;
    department: string;
    semester: number;
    section: string;
    email?: string;
    photo_base64?: string;
  }): Promise<Student> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async enrollStudentFace(id: number, photo_base64: string): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${id}/face`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ photo_base64 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Face enrollment failed' }));
      throw new Error(err.detail || 'Face enrollment failed');
    }
    return res.json();
  },

  async deleteStudent(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  // --- Attendance Sessions ---
  async getSessions(): Promise<AttendanceSession[]> {
    const res = await fetch(`${API_BASE}/attendance/sessions`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load sessions');
    return res.json();
  },

  async createSession(data: {
    course_id: number;
    session_title: string;
    match_threshold?: number;
  }): Promise<AttendanceSession> {
    const res = await fetch(`${API_BASE}/attendance/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  // --- Live Face AI Recognition ---
  async recognizeFrame(data: {
    session_id?: number;
    image_base64: string;
    min_confidence?: number;
  }): Promise<{ faces: RecognizedFace[]; faces_detected: number }> {
    const res = await fetch(`${API_BASE}/attendance/recognize-frame`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        session_id: data.session_id,
        image_base64: data.image_base64,
        min_confidence: data.min_confidence ?? 0.60
      })
    });
    if (!res.ok) throw new Error('Frame recognition request failed');
    return res.json();
  },

  // --- Attendance Records ---
  async getRecords(filters?: { session_id?: number; date_str?: string; student_id?: number }): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (filters?.session_id) params.append('session_id', filters.session_id.toString());
    if (filters?.date_str) params.append('date_str', filters.date_str);
    if (filters?.student_id) params.append('student_id', filters.student_id.toString());
    const res = await fetch(`${API_BASE}/attendance/records?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load records');
    return res.json();
  },

  async manualMark(data: {
    session_id: number;
    student_id: number;
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    remarks?: string;
  }): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE}/attendance/records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update record');
    return res.json();
  },

  getExportCsvUrl(session_id?: number): string {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (session_id) params.append('session_id', session_id.toString());
    if (token) params.append('token', token);
    const query = params.toString();
    return `${API_BASE}/attendance/export-csv${query ? `?${query}` : ''}`;
  },

  // --- Analytics ---
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load analytics overview');
    return res.json();
  },

  async getDefaulters(): Promise<DefaulterStudent[]> {
    const res = await fetch(`${API_BASE}/analytics/defaulters`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load defaulters');
    return res.json();
  },

  async getStudentPortalData(identifier: string): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/student/${identifier}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load student portal data');
    return res.json();
  }
};
