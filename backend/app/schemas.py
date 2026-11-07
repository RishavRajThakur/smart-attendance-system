"""
Pydantic schemas for request and response validation.
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str
    roll_number: Optional[str] = None
    department: Optional[str] = "Computer Science"
    designation: Optional[str] = None
    photo_url: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class ProfilePhotoRequest(BaseModel):
    photo_base64: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: Optional[str] = "Computer Science"
    designation: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Faculty Schemas ---
class FacultyOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str = "faculty"
    department: str = "Computer Science"
    designation: str = "Assistant Professor"
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    assigned_courses: List[str] = []
    course_ids: List[int] = []
    total_sessions: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class FacultyCreate(BaseModel):
    email: str
    password: str
    full_name: str
    department: str = "Computer Science"
    designation: str = "Assistant Professor"
    phone: Optional[str] = None
    course_ids: Optional[List[int]] = None


class FacultyUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    course_ids: Optional[List[int]] = None


class PasswordResetRequest(BaseModel):
    new_password: str


# --- Student Schemas ---
class StudentBase(BaseModel):
    roll_number: str
    full_name: str
    department: str = "Computer Science"
    semester: int = 7
    section: str = "A"
    email: Optional[str] = None


class StudentCreate(StudentBase):
    face_embedding: Optional[List[float]] = None
    photo_base64: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    photo_url: Optional[str] = None
    has_face_enrolled: bool = False
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Course Schemas ---
class CourseBase(BaseModel):
    course_code: str
    course_name: str
    department: str = "Computer Science"
    semester: int = 7


class CourseCreate(CourseBase):
    faculty_id: Optional[int] = None


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    faculty_id: Optional[int] = None


class CourseOut(CourseBase):
    id: int
    total_classes: int
    faculty_id: Optional[int] = None
    faculty_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Attendance Session Schemas ---
class SessionCreate(BaseModel):
    course_id: int
    session_title: str
    session_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    match_threshold: float = 0.65


class SessionOut(BaseModel):
    id: int
    course_id: int
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    session_title: str
    session_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str
    match_threshold: float
    total_present: int = 0
    total_enrolled: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# --- Attendance Record Schemas ---
class RecordCreate(BaseModel):
    session_id: int
    student_id: int
    status: str = "PRESENT"
    confidence_score: float = 1.0
    verification_method: str = "MANUAL_OVERRIDE"
    remarks: Optional[str] = None


class RecordOut(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_roll: str
    student_name: str
    student_photo: Optional[str] = None
    marked_at: datetime
    status: str
    confidence_score: float
    verification_method: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# --- AI Recognition Schemas ---
class FrameRecognitionRequest(BaseModel):
    session_id: Optional[int] = None
    image_base64: str  # Base64 data URL e.g. "data:image/jpeg;base64,..."
    min_confidence: float = 0.60


class RecognizedFace(BaseModel):
    bounding_box: List[int]  # [x, y, width, height]
    student_id: Optional[int] = None
    roll_number: Optional[str] = None
    full_name: Optional[str] = None
    confidence: float
    is_recognized: bool
    attendance_status: str  # "MARKED", "ALREADY_PRESENT", "UNKNOWN", "SKIPPED"
    message: str


class FrameRecognitionResponse(BaseModel):
    success: bool
    faces_detected: int
    faces: List[RecognizedFace]
    timestamp: str


# --- Analytics Schemas ---
class DefaulterStudent(BaseModel):
    id: int
    roll_number: str
    full_name: str
    department: str
    attended_sessions: int
    total_sessions: int
    attendance_percentage: float


class AnalyticsOverview(BaseModel):
    total_students: int
    total_courses: int
    total_faculty: int = 0
    active_sessions_today: int
    present_today: int = 0
    absent_today: int = 0
    not_marked_today: int = 0
    overall_attendance_rate: float
    defaulters_count: int
    weekly_trends: List[Dict[str, Any]]
    recent_records: List[RecordOut]
