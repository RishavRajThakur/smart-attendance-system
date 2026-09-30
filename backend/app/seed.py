"""
Database Seeder:
Populates demo users, academic courses, realistic students with embeddings,
and historical attendance records for an instant viva-ready demonstration.
"""

import json
import random
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, Student, Course, AttendanceSession, AttendanceRecord
from .auth import hash_password
from .services.face_engine import embedding_cache


def generate_synthetic_embedding(seed_val: int, dim: int = 128) -> list:
    """Generate a reproducible, unit-normalized float vector."""
    np.random.seed(seed_val)
    vec = np.random.randn(dim).astype(np.float32)
    norm = np.linalg.norm(vec)
    return (vec / norm).tolist()


def seed_database():
    """Seed initial demonstration dataset."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Faculty & Admin Users
        if db.query(User).count() == 0:
            print("[Seed] Creating demo users...")
            demo_users = [
                User(
                    email="faculty@college.edu",
                    password_hash=hash_password("faculty123"),
                    full_name="Prof. Manas Ranjan Biswal",
                    role="faculty"
                ),
                User(
                    email="admin@college.edu",
                    password_hash=hash_password("admin123"),
                    full_name="Dr. R. K. Mishra (HOD)",
                    role="admin"
                )
            ]
            db.add_all(demo_users)
            db.commit()

        # 2. Seed Courses
        if db.query(Course).count() == 0:
            print("[Seed] Creating 7th semester courses...")
            courses = [
                Course(course_code="CS701", course_name="Deep Learning & Neural Networks", department="Computer Science", semester=7, total_classes=24),
                Course(course_code="CS702", course_name="Computer Vision & Image Processing", department="Computer Science", semester=7, total_classes=22),
                Course(course_code="CS703", course_name="Cloud Computing & Distributed Systems", department="Computer Science", semester=7, total_classes=20),
                Course(course_code="CS704", course_name="Cybersecurity & Cryptography", department="Computer Science", semester=7, total_classes=18),
            ]
            db.add_all(courses)
            db.commit()

        # 3. Seed Students
        if db.query(Student).count() == 0:
            print("[Seed] Creating student roster with biometric embeddings...")
            student_roster = [
                ("2021CSE001", "Aarav Sharma", "A"),
                ("2021CSE014", "Diya Mukherjee", "A"),
                ("2021CSE023", "Ishaan Verma", "A"),
                ("2021CSE042", "Rahul Sharma", "A"),
                ("2021CSE055", "Priya Nair", "A"),
                ("2021CSE068", "Rohan Gupta", "B"),
                ("2021CSE079", "Sneha Roy", "B"),
                ("2021CSE091", "Tanmay Kulkarni", "B"),
                ("2021CSE104", "Ananya Ghosh", "B"),
                ("2021CSE118", "Vikramaditya Rao", "B"),
                ("2021CSE125", "Meera Pillai", "A"),
                ("2021CSE133", "Kabir Bedi", "B"),
                ("2021CSE149", "Ritu Agarwal", "A"),
                ("2021CSE156", "Siddharth Jain", "B"),
                ("2021CSE162", "Zara Sheikh", "A")
            ]

            created_students = []
            for idx, (roll, name, sec) in enumerate(student_roster, start=1):
                emb = generate_synthetic_embedding(seed_val=1000 + idx, dim=128)
                st = Student(
                    roll_number=roll,
                    full_name=name,
                    department="Computer Science",
                    semester=7,
                    section=sec,
                    email=f"{roll.lower()}@student.college.edu",
                    photo_url=None,
                    face_embedding=json.dumps(emb),
                    is_active=True
                )
                created_students.append(st)
                db.add(st)
            db.commit()

        # 4. Seed Past Attendance Sessions & Records
        if db.query(AttendanceSession).count() == 0:
            print("[Seed] Creating historical attendance records...")
            courses = db.query(Course).all()
            students = db.query(Student).all()
            faculty = db.query(User).filter(User.role == "faculty").first()

            today = datetime.utcnow().date()
            sessions = []

            # Create 8 past sessions
            for offset in range(8, 0, -1):
                s_date = today - timedelta(days=offset)
                c = courses[offset % len(courses)]
                session = AttendanceSession(
                    course_id=c.id,
                    faculty_id=faculty.id if faculty else None,
                    session_title=f"{c.course_name} — Lecture {25 - offset}",
                    session_date=s_date,
                    start_time="10:00 AM",
                    end_time="11:30 AM",
                    status="completed",
                    match_threshold=0.65
                )
                db.add(session)
                db.flush()
                sessions.append(session)

                # Add records for each student
                for st in students:
                    # Specific students have lower attendance to create realistic defaulters
                    is_habitual_absentee = st.roll_number in ["2021CSE023", "2021CSE118"]
                    present_prob = 0.50 if is_habitual_absentee else 0.90
                    is_present = random.random() < present_prob

                    if is_present:
                        rec = AttendanceRecord(
                            session_id=session.id,
                            student_id=st.id,
                            marked_at=datetime.combine(s_date, datetime.min.time()) + timedelta(hours=10, minutes=random.randint(1, 20)),
                            status="PRESENT",
                            confidence_score=round(random.uniform(0.88, 0.98), 2),
                            verification_method="FACE_AI"
                        )
                        db.add(rec)
                    else:
                        rec = AttendanceRecord(
                            session_id=session.id,
                            student_id=st.id,
                            marked_at=datetime.combine(s_date, datetime.min.time()) + timedelta(hours=11, minutes=30),
                            status="ABSENT",
                            confidence_score=0.0,
                            verification_method="SYSTEM_TIMEOUT"
                        )
                        db.add(rec)

            # Create 1 Active Session for Today
            active_today = AttendanceSession(
                course_id=courses[0].id,
                faculty_id=faculty.id if faculty else None,
                session_title=f"{courses[0].course_name} — Live Class",
                session_date=today,
                start_time="11:00 AM",
                end_time="12:30 PM",
                status="active",
                match_threshold=0.65
            )
            db.add(active_today)
            db.flush()

            # Mark 5 students already present in today's active session
            for st in students[:5]:
                rec = AttendanceRecord(
                    session_id=active_today.id,
                    student_id=st.id,
                    marked_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 25)),
                    status="PRESENT",
                    confidence_score=round(random.uniform(0.91, 0.97), 2),
                    verification_method="FACE_AI"
                )
                db.add(rec)

            db.commit()

        # Refresh in-memory cache
        all_students = db.query(Student).filter(Student.is_active == True).all()
        embedding_cache.refresh(all_students)
        print(f"[Seed] Successfully initialized system with {len(all_students)} enrolled biometric profiles.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
