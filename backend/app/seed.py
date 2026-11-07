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
        admin_user = db.query(User).filter(User.email == "admin@college.edu").first()
        if not admin_user:
            admin_user = User(
                email="admin@college.edu",
                password_hash=hash_password("admin123"),
                full_name="Dr. R. K. Mishra (HOD)",
                role="admin",
                department="Computer Science & Engineering",
                designation="Head of Department & System Administrator",
                phone="+91 98765 43210"
            )
            db.add(admin_user)

        fac1 = db.query(User).filter(User.email == "faculty@college.edu").first()
        if not fac1:
            fac1 = User(
                email="faculty@college.edu",
                password_hash=hash_password("faculty123"),
                full_name="Prof. Manas Ranjan Biswal",
                role="faculty",
                department="Computer Science & Engineering",
                designation="Assistant Professor & Lab Lead",
                phone="+91 98111 22334"
            )
            db.add(fac1)
        else:
            fac1.full_name = "Prof. Manas Ranjan Biswal"
            fac1.department = "Computer Science & Engineering"
            fac1.designation = "Assistant Professor & Lab Lead"

        fac2 = db.query(User).filter(User.email == "ananya.sen@college.edu").first()
        if not fac2:
            fac2 = User(
                email="ananya.sen@college.edu",
                password_hash=hash_password("faculty123"),
                full_name="Prof. Ananya Sen",
                role="faculty",
                department="Computer Science & Engineering",
                designation="Associate Professor",
                phone="+91 98222 33445"
            )
            db.add(fac2)

        db.commit()

        # Re-fetch users to get IDs
        fac1 = db.query(User).filter(User.email == "faculty@college.edu").first()
        fac2 = db.query(User).filter(User.email == "ananya.sen@college.edu").first()

        # 2. Seed / Update Courses with Faculty Assignment
        courses_data = [
            ("CS701", "Deep Learning & Neural Networks", 24, fac1.id if fac1 else None),
            ("CS702", "Computer Vision & Image Processing", 22, fac1.id if fac1 else None),
            ("CS703", "Cloud Computing & Distributed Systems", 20, fac2.id if fac2 else None),
            ("CS704", "Cybersecurity & Cryptography", 18, fac2.id if fac2 else None),
        ]

        for code, name, total_cls, f_id in courses_data:
            c = db.query(Course).filter(Course.course_code == code).first()
            if not c:
                c = Course(course_code=code, course_name=name, department="Computer Science", semester=7, total_classes=total_cls, faculty_id=f_id)
                db.add(c)
            else:
                c.faculty_id = f_id
        db.commit()

        # 3. Seed Students
        student_roster = [
            ("2103001", "Aman Kumar", "A", "/assets/student_aman.jpg"),
            ("2021CSE042", "Rahul Sharma", "A", "/assets/student_rohit.jpg"),
            ("2021CSE001", "Aarav Sharma", "A", None),
            ("2021CSE014", "Diya Mukherjee", "A", "/assets/student_priya.jpg"),
            ("2021CSE023", "Ishaan Verma", "A", None),
            ("2021CSE055", "Priya Nair", "A", "/assets/student_sneha.jpg"),
            ("2021CSE068", "Rohan Gupta", "B", None),
            ("2021CSE079", "Sneha Roy", "B", None),
            ("2021CSE091", "Tanmay Kulkarni", "B", None),
            ("2021CSE104", "Ananya Ghosh", "B", None),
            ("2021CSE118", "Vikramaditya Rao", "B", None),
            ("2021CSE125", "Meera Pillai", "A", None),
            ("2021CSE133", "Kabir Bedi", "B", None),
            ("2021CSE149", "Ritu Agarwal", "A", None),
            ("2021CSE156", "Siddharth Jain", "B", None),
            ("2021CSE162", "Zara Sheikh", "A", None),
            ("23053434", "Rishav Raj Thakur", "A", None)
        ]

        for idx, (roll, name, sec, photo) in enumerate(student_roster, start=1):
            existing = db.query(Student).filter(Student.roll_number == roll).first()
            if not existing:
                emb = generate_synthetic_embedding(seed_val=1000 + idx, dim=128)
                st = Student(
                    roll_number=roll,
                    full_name=name,
                    department="Computer Science",
                    semester=7,
                    section=sec,
                    email=f"{roll.lower()}@student.college.edu",
                    photo_url=photo,
                    face_embedding=json.dumps(emb),
                    is_active=True
                )
                db.add(st)
            else:
                if photo and not existing.photo_url:
                    existing.photo_url = photo
                if not existing.face_embedding:
                    emb = generate_synthetic_embedding(seed_val=1000 + idx, dim=128)
                    existing.face_embedding = json.dumps(emb)
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
                    faculty_id=c.faculty_id or (fac1.id if fac1 else None),
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

        # Ensure existing sessions have faculty_id linked
        null_sessions = db.query(AttendanceSession).filter(AttendanceSession.faculty_id == None).all()
        if null_sessions:
            fac1 = db.query(User).filter(User.email == "faculty@college.edu").first()
            for sess in null_sessions:
                if sess.course and sess.course.faculty_id:
                    sess.faculty_id = sess.course.faculty_id
                elif fac1:
                    sess.faculty_id = fac1.id
            db.commit()

        # Refresh in-memory cache
        all_students = db.query(Student).filter(Student.is_active == True).all()
        embedding_cache.refresh(all_students)
        print(f"[Seed] Successfully initialized system with {len(all_students)} enrolled biometric profiles.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
