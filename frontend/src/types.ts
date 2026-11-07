export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty' | 'student';
  department?: string;
  designation?: string;
  phone?: string;
  roll_number?: string;
  photo_url?: string;
  created_at?: string;
}

export interface FacultyMember {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department: string;
  designation: string;
  phone?: string;
  photo_url?: string;
  assigned_courses: string[];
  course_ids: number[];
  total_sessions: number;
  created_at: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  semester: number;
  total_classes: number;
  faculty_id?: number | null;
  faculty_name?: string;
}

export interface Student {
  id: number;
  roll_number: string;
  full_name: string;
  department: string;
  semester: number;
  section: string;
  email?: string;
  photo_url?: string;
  has_face_enrolled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceSession {
  id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  session_title: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  match_threshold: number;
  total_present: number;
  total_enrolled: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student_roll: string;
  student_name: string;
  student_photo?: string;
  marked_at: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  confidence_score: number;
  verification_method: string;
  remarks?: string;
}

export interface RecognizedFace {
  bounding_box: [number, number, number, number]; // [x, y, w, h]
  student_id: number | null;
  roll_number: string | null;
  full_name: string | null;
  confidence: number;
  is_recognized: boolean;
  attendance_status: 'MARKED' | 'ALREADY_PRESENT' | 'UNKNOWN' | 'SKIPPED';
  message: string;
}

export interface DefaulterStudent {
  id: number;
  roll_number: string;
  full_name: string;
  department: string;
  attended_sessions: number;
  total_sessions: number;
  attendance_percentage: number;
}

export interface AnalyticsOverview {
  total_students: number;
  total_courses: number;
  total_faculty?: number;
  active_sessions_today: number;
  present_today?: number;
  absent_today?: number;
  not_marked_today?: number;
  overall_attendance_rate: number;
  defaulters_count: number;
  weekly_trends: Array<{
    day: string;
    date: string;
    present: number;
    absent: number;
    rate: number;
  }>;
  recent_records: AttendanceRecord[];
}
