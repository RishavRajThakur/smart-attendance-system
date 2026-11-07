"""
Analytics & Insights Router:
Calculates overall metrics, weekly trends, statutory university defaulters (<75%),
and personal student attendance status.
"""

from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Student, AttendanceSession, AttendanceRecord, Course, User
from ..schemas import AnalyticsOverview, DefaulterStudent, RecordOut

from ..auth import get_current_user, require_faculty_or_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    current_user: Optional[Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Summary metrics and trends. Scoped for Faculty; global for Admin."""
    today = datetime.utcnow().date()

    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_courses = db.query(Course).count()
    total_faculty = db.query(User).filter(User.role == "faculty").count()

    is_faculty = current_user and getattr(current_user, "role", None) == "faculty"

    # Today's active sessions query
    today_sessions_query = db.query(AttendanceSession).filter(AttendanceSession.session_date == today)
    has_fac_courses = False
    fac_sessions_sub = None

    if is_faculty:
        fac_courses = db.query(Course.id).filter(Course.faculty_id == current_user.id).subquery()
        fac_sessions_sub = db.query(AttendanceSession.id).filter(
            (AttendanceSession.faculty_id == current_user.id) |
            (AttendanceSession.course_id.in_(fac_courses))
        ).subquery()
        has_fac_courses = db.query(Course).filter(Course.faculty_id == current_user.id).count() > 0
        if has_fac_courses:
            total_courses = db.query(Course).filter(Course.faculty_id == current_user.id).count()
            today_sessions_query = today_sessions_query.filter(AttendanceSession.id.in_(fac_sessions_sub))

    today_session_ids = [s.id for s in today_sessions_query.all()]
    active_sessions_today = len(today_session_ids)

    # Calculate real today counts
    if active_sessions_today > 0:
        present_today = db.query(AttendanceRecord.student_id).filter(
            AttendanceRecord.session_id.in_(today_session_ids),
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).distinct().count()

        absent_today = db.query(AttendanceRecord.student_id).filter(
            AttendanceRecord.session_id.in_(today_session_ids),
            AttendanceRecord.status == "ABSENT"
        ).distinct().count()

        not_marked_today = max(0, total_students - present_today - absent_today)
    else:
        present_today = 0
        absent_today = 0
        not_marked_today = 0

    # Real overall attendance rate
    if is_faculty and has_fac_courses:
        fac_records_total = db.query(AttendanceRecord).filter(AttendanceRecord.session_id.in_(fac_sessions_sub)).count()
        fac_records_present = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id.in_(fac_sessions_sub),
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        rate = round((fac_records_present / fac_records_total * 100), 1) if fac_records_total > 0 else 0.0
    else:
        total_records = db.query(AttendanceRecord).count()
        present_records = db.query(AttendanceRecord).filter(AttendanceRecord.status.in_(["PRESENT", "LATE"])).count()
        rate = round((present_records / total_records * 100), 1) if total_records > 0 else 0.0

    # Calculate Defaulters (< 75% attendance)
    students = db.query(Student).filter(Student.is_active == True).all()
    defaulter_count = 0
    total_sessions_count = db.query(AttendanceSession).count()

    if total_sessions_count > 0:
        for s in students:
            student_presents = db.query(AttendanceRecord).filter(
                AttendanceRecord.student_id == s.id,
                AttendanceRecord.status.in_(["PRESENT", "LATE"])
            ).count()
            pct = (student_presents / total_sessions_count) * 100
            if pct < 75.0:
                defaulter_count += 1

    # Weekly Trends (Last 5 class days) - 100% Real data, no synthetic random values
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    weekly_trends = []
    for i, day in enumerate(days):
        day_date = today - timedelta(days=(4 - i))
        day_records = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.session_date == day_date
        ).count()
        day_presents = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.session_date == day_date,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        day_absents = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.session_date == day_date,
            AttendanceRecord.status == "ABSENT"
        ).count()

        present_val = day_presents
        absent_val = day_absents
        rate_val = round((present_val / day_records * 100), 1) if day_records > 0 else 0.0

        weekly_trends.append({
            "day": day,
            "date": day_date.strftime("%b %d"),
            "present": present_val,
            "absent": absent_val,
            "rate": rate_val
        })

    # Recent records
    recent_query = db.query(AttendanceRecord).order_by(AttendanceRecord.marked_at.desc())
    if is_faculty and has_fac_courses and fac_sessions_sub is not None:
        recent_query = recent_query.filter(AttendanceRecord.session_id.in_(fac_sessions_sub))

    recent = recent_query.limit(8).all()
    recent_outs = [
        RecordOut(
            id=r.id,
            session_id=r.session_id,
            student_id=r.student_id,
            student_roll=r.student.roll_number,
            student_name=r.student.full_name,
            student_photo=r.student.photo_url,
            marked_at=r.marked_at,
            status=r.status,
            confidence_score=r.confidence_score,
            verification_method=r.verification_method,
            remarks=r.remarks
        )
        for r in recent
    ]

    return AnalyticsOverview(
        total_students=total_students,
        total_courses=total_courses,
        total_faculty=total_faculty,
        active_sessions_today=active_sessions_today,
        present_today=present_today,
        absent_today=absent_today,
        not_marked_today=not_marked_today,
        overall_attendance_rate=rate,
        defaulters_count=defaulter_count,
        weekly_trends=weekly_trends,
        recent_records=recent_outs
    )


@router.get("/defaulters", response_model=List[DefaulterStudent])
def get_defaulters_list(
    current_user: Any = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """Returns students whose attendance is below statutory university 75% threshold."""
    students = db.query(Student).filter(Student.is_active == True).all()
    total_sessions_count = db.query(AttendanceSession).count()
    if total_sessions_count == 0:
        total_sessions_count = 1

    defaulters = []
    for s in students:
        presents = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        pct = round((presents / total_sessions_count) * 100, 1)

        if pct < 75.0:
            defaulters.append(DefaulterStudent(
                id=s.id,
                roll_number=s.roll_number,
                full_name=s.full_name,
                department=s.department,
                attended_sessions=presents,
                total_sessions=total_sessions_count,
                attendance_percentage=pct
            ))

    return sorted(defaulters, key=lambda x: x.attendance_percentage)


@router.get("/student/{identifier}")
def get_student_portal_analytics(
    identifier: str,
    current_user: Optional[Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Personalized attendance breakdown for a student with privacy check."""
    # Try ID first, then Roll Number
    student = None
    if identifier.isdigit():
        student = db.query(Student).filter(Student.id == int(identifier)).first()
    if not student:
        student = db.query(Student).filter(Student.roll_number.ilike(identifier.strip())).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Strict Student Privacy: Student can only view their OWN attendance!
    if current_user and getattr(current_user, "role", None) == "student":
        user_roll = getattr(current_user, "roll_number", "")
        user_id = getattr(current_user, "id", None)
        if str(student.id) != str(user_id) and student.roll_number.upper() != str(user_roll).upper():
            raise HTTPException(
                status_code=403,
                detail="Access restricted: You cannot access another student's attendance records."
            )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total_sessions = db.query(AttendanceSession).count()
    attended_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.status.in_(["PRESENT", "LATE"])
    ).all()

    attended_count = len(attended_records)
    base_total = max(total_sessions, 1)
    pct = round((attended_count / base_total * 100), 1)

    # Subject-wise calculation
    courses = db.query(Course).all()
    subject_stats = []
    for c in courses:
        c_sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == c.id).count()
        c_presents = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceSession.course_id == c.id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()
        c_total = max(c_sessions, 1)
        c_pct = round((c_presents / c_total * 100), 1)
        subject_stats.append({
            "course_id": c.id,
            "course_code": c.course_code,
            "course_name": c.course_name,
            "attended": c_presents,
            "total": c_sessions,
            "percentage": c_pct,
            "is_shortage": c_pct < 75.0
        })

    # Recent personal records
    my_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.marked_at.desc()).limit(15).all()

    return {
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "full_name": student.full_name,
            "department": student.department,
            "semester": student.semester,
            "section": student.section,
            "photo_url": student.photo_url
        },
        "overall_percentage": pct,
        "is_eligible_for_exams": pct >= 75.0,
        "classes_attended": attended_count,
        "total_classes": total_sessions,
        "subject_breakdown": subject_stats,
        "history": [
            {
                "session_title": r.session.session_title if r.session else "Session",
                "course_name": r.session.course.course_name if r.session and r.session.course else "Course",
                "date": r.session.session_date.strftime("%Y-%m-%d") if r.session and r.session.session_date else "N/A",
                "status": r.status,
                "marked_at": r.marked_at.strftime("%I:%M %p"),
                "method": r.verification_method,
                "confidence": f"{int(r.confidence_score * 100)}%"
            }
            for r in my_records
        ]
    }
