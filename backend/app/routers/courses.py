"""
Courses & Academic Subjects Router:
Allows viewing, creation, and faculty assignment for academic courses.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Course, User
from ..schemas import CourseOut, CourseCreate, CourseUpdate
from ..auth import require_admin, require_faculty_or_admin

router = APIRouter(prefix="/api/courses", tags=["Academic Subjects & Courses"])


def _serialize_course(course: Course) -> CourseOut:
    return CourseOut(
        id=course.id,
        course_code=course.course_code,
        course_name=course.course_name,
        department=course.department,
        semester=course.semester,
        total_classes=course.total_classes,
        faculty_id=course.faculty_id,
        faculty_name=course.faculty.full_name if course.faculty else "Unassigned"
    )


@router.get("", response_model=List[CourseOut])
def list_courses(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """List academic subjects/courses with assigned faculty information."""
    query = db.query(Course)
    if department:
        query = query.filter(Course.department == department)
    if semester:
        query = query.filter(Course.semester == semester)

    courses = query.order_by(Course.course_code.asc()).all()
    return [_serialize_course(c) for c in courses]


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: int,
    current_user: User = Depends(require_faculty_or_admin),
    db: Session = Depends(get_db)
):
    """Get single course details."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _serialize_course(course)


@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Create new course/subject and assign faculty."""
    existing = db.query(Course).filter(Course.course_code == payload.course_code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course with code '{payload.course_code}' already exists.")

    new_course = Course(
        course_code=payload.course_code.strip().upper(),
        course_name=payload.course_name.strip(),
        department=payload.department or "Computer Science",
        semester=payload.semester or 7,
        faculty_id=payload.faculty_id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return _serialize_course(new_course)


@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Update course details and assign/reassign faculty."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if payload.course_name:
        course.course_name = payload.course_name.strip()
    if payload.department:
        course.department = payload.department.strip()
    if payload.semester:
        course.semester = payload.semester
    if payload.faculty_id is not None:
        course.faculty_id = payload.faculty_id if payload.faculty_id > 0 else None

    db.commit()
    db.refresh(course)
    return _serialize_course(course)


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only: Delete an academic course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"success": True, "message": f"Course {course.course_code} deleted successfully."}
