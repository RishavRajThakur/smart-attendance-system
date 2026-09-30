"""
Student Management Router:
Handles student profiles, enrollment, biometric face registration, and embedding cache reload.
"""

import os
import json
import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, AttendanceRecord
from ..schemas import StudentCreate, StudentOut
from ..services.face_engine import (
    decode_base64_image, detect_faces, extract_face_embedding, embedding_cache
)

router = APIRouter(prefix="/api/students", tags=["Students"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[StudentOut])
def list_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List students with optional search and filters."""
    query = db.query(Student).filter(Student.is_active == True)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Student.full_name.ilike(s)) | (Student.roll_number.ilike(s)))
    if department:
        query = query.filter(Student.department == department)
    if semester:
        query = query.filter(Student.semester == semester)

    students = query.order_by(Student.roll_number.asc()).all()

    # Annotate with has_face_enrolled
    results = []
    for st in students:
        has_face = bool(st.face_embedding and len(st.face_embedding) > 20)
        results.append(StudentOut(
            id=st.id,
            roll_number=st.roll_number,
            full_name=st.full_name,
            department=st.department,
            semester=st.semester,
            section=st.section,
            email=st.email,
            photo_url=st.photo_url,
            has_face_enrolled=has_face,
            is_active=st.is_active,
            created_at=st.created_at
        ))
    return results


@router.get("/{student_id}")
def get_student_details(student_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed student profile including personal attendance statistics."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    total_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).count()
    present_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id,
        AttendanceRecord.status == "PRESENT"
    ).count()

    percentage = round((present_records / total_records * 100), 1) if total_records > 0 else 0.0

    return {
        "id": student.id,
        "roll_number": student.roll_number,
        "full_name": student.full_name,
        "department": student.department,
        "semester": student.semester,
        "section": student.section,
        "email": student.email,
        "photo_url": student.photo_url,
        "has_face_enrolled": bool(student.face_embedding and len(student.face_embedding) > 20),
        "total_classes": total_records,
        "attended_classes": present_records,
        "attendance_percentage": percentage,
        "is_eligible_for_exams": percentage >= 75.0 or total_records == 0,
        "created_at": student.created_at
    }


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentCreate, db: Session = Depends(get_db)):
    """
    Register a new student with biometric facial features.
    Accepts student details and optional webcam capture photo to extract embeddings.
    """
    # Check duplicate roll number
    existing = db.query(Student).filter(Student.roll_number == payload.roll_number.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student with Roll Number {payload.roll_number} already exists")

    photo_url = None
    embedding_vector = payload.face_embedding

    # If photo base64 is provided, decode and extract biometric embedding
    if payload.photo_base64:
        try:
            bgr_img = decode_base64_image(payload.photo_base64)
            faces = detect_faces(bgr_img)
            
            if len(faces) == 0:
                raise HTTPException(status_code=400, detail="No face detected in the photo. Please center your face in good lighting.")
            if len(faces) > 1:
                raise HTTPException(status_code=400, detail="Multiple faces detected. Ensure only one person is in front of the camera.")

            # Extract embedding
            embedding_vector = extract_face_embedding(bgr_img, faces[0])

            # Save reference photo to disk
            filename = f"student_{payload.roll_number.strip().upper()}.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # Crop to face with margin
            x, y, w, h = faces[0]
            pad = int(0.2 * min(w, h))
            h_img, w_img = bgr_img.shape[:2]
            crop = bgr_img[max(0, y-pad):min(h_img, y+h+pad), max(0, x-pad):min(w_img, x+w+pad)]
            import cv2
            cv2.imwrite(filepath, crop if crop.size > 0 else bgr_img)
            photo_url = f"/static/uploads/{filename}"

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

    new_student = Student(
        roll_number=payload.roll_number.strip().upper(),
        full_name=payload.full_name.strip(),
        department=payload.department,
        semester=payload.semester,
        section=payload.section,
        email=payload.email,
        photo_url=photo_url,
        face_embedding=json.dumps(embedding_vector) if embedding_vector else None,
        is_active=True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Refresh in-memory matching cache
    all_students = db.query(Student).filter(Student.is_active == True).all()
    embedding_cache.refresh(all_students)

    return StudentOut(
        id=new_student.id,
        roll_number=new_student.roll_number,
        full_name=new_student.full_name,
        department=new_student.department,
        semester=new_student.semester,
        section=new_student.section,
        email=new_student.email,
        photo_url=new_student.photo_url,
        has_face_enrolled=bool(new_student.face_embedding),
        is_active=new_student.is_active,
        created_at=new_student.created_at
    )


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Deactivate or remove student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()

    # Refresh in-memory cache
    all_students = db.query(Student).filter(Student.is_active == True).all()
    embedding_cache.refresh(all_students)

    return {"message": "Student deleted successfully"}
