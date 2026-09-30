import type {
  User, Student, AttendanceSession, AttendanceRecord,
  AnalyticsOverview, DefaulterStudent, RecognizedFace
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
  async login(email: string, password: string): Promise<{ access_token: string; role: string; full_name: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Authentication failed');
    }
    const data = await res.json();
    if (data.role !== 'student' || !data.full_name || data.full_name.includes('Rishav')) {
      data.full_name = 'Prof. Manas Ranjan Biswal';
    }
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      if (user) {
        if (user.role !== 'student' || !user.full_name || user.full_name.includes('Rishav')) {
          user.full_name = 'Prof. Manas Ranjan Biswal';
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // --- Students ---
  async getStudents(search?: string, department?: string, semester?: number): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester.toString());
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
  async getRecords(filters?: { session_id?: number; date_str?: string }): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (filters?.session_id) params.append('session_id', filters.session_id.toString());
    if (filters?.date_str) params.append('date_str', filters.date_str);
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
    return `${API_BASE}/attendance/export-csv${session_id ? `?session_id=${session_id}` : ''}`;
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
