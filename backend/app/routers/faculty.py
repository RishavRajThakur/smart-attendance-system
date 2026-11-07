"""
Faculty Management Router:
Provides full faculty administration for Admin role (view all, add/edit, credential change/reset),
and strict private self-view for individual Faculty role.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Course, AttendanceSession
from ..schemas import FacultyOut, FacultyCreate, FacultyUpdate, PasswordResetRequest
from ..auth import hash_password, get_current_user, require_admin, require_faculty_or_admin

router = APIRouter(prefix="/api/faculty", tags=["Faculty Management"])


def _serialize_faculty(faculty: User, db: Session) -> FacultyOut:
    courses = db.query(Course).filter(Course.faculty_id == faculty.id).all()
    course_names = [f"{c.course_code}: {c.course_name}" for c in courses]
    course_ids = [c.id for c in courses]
    sessions_count = db.query(AttendanceSession).filter(AttendanceSession.faculty_id == faculty.id).count()

    return FacultyOut(
        id=faculty.id,
        email=faculty.email,
        full_name=faculty.full_name,
        role=faculty.role,
        department=getattr(faculty, "department", "Computer Science") or "Computer Science",
        designation=getattr(faculty, "designation", "Assistant Professor") or "Assistant Professor",
        phone=getattr(faculty, "phone", None),
        photo_url=getattr(faculty, "photo_url", None),
        assigned_courses=course_names,
        course_ids=course_ids,
        total_sessions=sessions_count,
        created_at=faculty.created_at
    )


@router.get("", response_model=List[FacultyOut])
def list_faculty(
    current_user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """
    List faculty members.
    - Admin: Complete view of all faculty members.
    - Faculty: Restricted ONLY to their own information. Cannot view other faculty's data.
    """
    if current_user.role == "admin":
        # Return all faculty users
        faculty_list = db.query(User).filter(User.role.in_(["faculty", "admin"])).order_by(User.id.asc()).all()
        return [_serialize_faculty(f, db) for f in faculty_list]

    # Faculty member: ONLY return their own profile
    return [_serialize_faculty(current_user, db)]


@router.get("/me", response_model=FacultyOut)
def get_my_faculty_profile(
    current_user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """Get the authenticated faculty member's own profile and assigned courses."""
    return _serialize_faculty(current_user, db)


@router.get("/{faculty_id}", response_model=FacultyOut)
def get_faculty_by_id(
    faculty_id: int,
    current_user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """
    Get faculty details by ID.
    - Admin: Can view any faculty.
    - Faculty: Can ONLY view their own ID. Other faculty access is strictly forbidden.
    """
    if current_user.role != "admin" and current_user.id != faculty_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: You are not authorized to view another faculty member's personal data."
        )

    faculty = db.query(User).filter(User.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    return _serialize_faculty(faculty, db)


@router.post("", response_model=FacultyOut, status_code=status.HTTP_201_CREATED)
def create_faculty(
    payload: FacultyCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Create a new faculty member with credentials and assigned subjects."""
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists.")

    new_faculty = User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="faculty",
        department=payload.department or "Computer Science",
        designation=payload.designation or "Assistant Professor",
        phone=payload.phone
    )
    db.add(new_faculty)
    db.commit()
    db.refresh(new_faculty)

    # Assign courses if provided
    if payload.course_ids:
        for cid in payload.course_ids:
            course = db.query(Course).filter(Course.id == cid).first()
            if course:
                course.faculty_id = new_faculty.id
        db.commit()

    return _serialize_faculty(new_faculty, db)


@router.put("/{faculty_id}", response_model=FacultyOut)
def update_faculty(
    faculty_id: int,
    payload: FacultyUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Update faculty details, user ID (email), and assigned subjects."""
    faculty = db.query(User).filter(User.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    if payload.email and payload.email.strip().lower() != faculty.email.lower():
        existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
        if existing and existing.id != faculty_id:
            raise HTTPException(status_code=400, detail="Email is already in use by another user.")
        faculty.email = payload.email.strip().lower()

    if payload.full_name:
        faculty.full_name = payload.full_name.strip()
    if payload.department:
        faculty.department = payload.department.strip()
    if payload.designation:
        faculty.designation = payload.designation.strip()
    if payload.phone is not None:
        faculty.phone = payload.phone.strip() if payload.phone else None

    # Update course assignments if given
    if payload.course_ids is not None:
        # Unassign courses currently assigned to this faculty
        db.query(Course).filter(Course.faculty_id == faculty_id).update({"faculty_id": None})
        # Assign new courses
        for cid in payload.course_ids:
            c = db.query(Course).filter(Course.id == cid).first()
            if c:
                c.faculty_id = faculty_id

    db.commit()
    db.refresh(faculty)
    return _serialize_faculty(faculty, db)


@router.post("/{faculty_id}/reset-password")
def reset_faculty_password(
    faculty_id: int,
    payload: PasswordResetRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin-only: Change or reset faculty member login password.
    Direct implementation of requirement 2.
    """
    faculty = db.query(User).filter(User.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    if len(payload.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    faculty.password_hash = hash_password(payload.new_password.strip())
    db.commit()

    return {
        "success": True,
        "message": f"Login credentials updated: Password for {faculty.full_name} ({faculty.email}) has been successfully reset.",
        "faculty_id": faculty.id,
        "email": faculty.email
    }


@router.delete("/{faculty_id}")
def delete_faculty(
    faculty_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Remove a faculty member."""
    if current_user.id == faculty_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")

    faculty = db.query(User).filter(User.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    # Unlink any assigned courses
    db.query(Course).filter(Course.faculty_id == faculty_id).update({"faculty_id": None})

    db.delete(faculty)
    db.commit()
    return {"success": True, "message": f"Faculty member {faculty.full_name} has been removed."}
