"""
SQLAlchemy ORM Models for the AI Smart Attendance System.
Designed cleanly in 3NF for academic presentation & production reliability.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """System users (Admin, Faculty, Student)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="faculty")  # admin, faculty, student
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("AttendanceSession", back_populates="faculty")


class Student(Base):
    """Enrolled students with facial biometric embeddings"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(30), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False, default="Computer Science")
    semester = Column(Integer, nullable=False, default=7)
    section = Column(String(10), nullable=False, default="A")
    email = Column(String(120), unique=True, nullable=True)
    photo_url = Column(String(255), nullable=True)
    face_embedding = Column(Text, nullable=True)  # JSON serialized list of floats (512-d or 128-d)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")


class Course(Base):
    """Academic subjects/courses offered in the semester"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(120), nullable=False)
    department = Column(String(50), default="Computer Science")
    semester = Column(Integer, default=7)
    total_classes = Column(Integer, default=0)

    # Relationships
    sessions = relationship("AttendanceSession", back_populates="course")


class AttendanceSession(Base):
    """Individual class sessions created by faculty for attendance tracking"""
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_title = Column(String(150), nullable=False)
    session_date = Column(Date, default=datetime.utcnow().date)
    start_time = Column(String(20), nullable=True)
    end_time = Column(String(20), nullable=True)
    status = Column(String(20), default="active")  # active, completed, cancelled
    match_threshold = Column(Float, default=0.65)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="sessions")
    faculty = relationship("User", back_populates="sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    """Individual student attendance mark for a specific session"""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    marked_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="PRESENT")  # PRESENT, LATE, ABSENT
    confidence_score = Column(Float, default=1.0)   # Matching confidence e.g. 0.94
    verification_method = Column(String(30), default="FACE_AI")  # FACE_AI, MANUAL_OVERRIDE
    remarks = Column(String(150), nullable=True)

    # Enforce one record per student per session to avoid duplicates
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student"),
    )

    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="records")
