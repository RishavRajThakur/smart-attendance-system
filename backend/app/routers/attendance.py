"""
Attendance Router:
Session lifecycle management, real-time webcam frame recognition,
instant attendance logging with deduplication, and CSV export.
"""

import io
import csv
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AttendanceSession, AttendanceRecord, Student, Course
from ..schemas import (
    SessionCreate, SessionOut, RecordCreate, RecordOut,
    FrameRecognitionRequest, FrameRecognitionResponse, RecognizedFace
)
from ..services.face_engine import (
    decode_base64_image, detect_faces, extract_face_embedding,
    check_image_quality, embedding_cache
)

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db)):
    """List all attendance sessions with live count metrics."""
    sessions = db.query(AttendanceSession).order_by(AttendanceSession.session_date.desc(), AttendanceSession.id.desc()).all()
    total_enrolled = db.query(Student).filter(Student.is_active == True).count()

    results = []
    for s in sessions:
        present_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "LATE"])
        ).count()

        results.append(SessionOut(
            id=s.id,
            course_id=s.course_id,
            course_name=s.course.course_name if s.course else "General Session",
            course_code=s.course.course_code if s.course else "GEN101",
            session_title=s.session_title,
            session_date=s.session_date,
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status,
            match_threshold=s.match_threshold,
            total_present=present_count,
            total_enrolled=total_enrolled,
            created_at=s.created_at
        ))
    return results


@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    """Create a new attendance session for a class or lab."""
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        # Default course fallback if not specified
        course = db.query(Course).first()
        if not course:
            course = Course(course_code="CS701", course_name="Deep Learning & Neural Networks")
            db.add(course)
            db.commit()
            db.refresh(course)
        payload.course_id = course.id

    now = datetime.utcnow()
    new_session = AttendanceSession(
        course_id=payload.course_id,
        session_title=payload.session_title,
        session_date=payload.session_date or now.date(),
        start_time=payload.start_time or now.strftime("%I:%M %p"),
        end_time=payload.end_time,
        status="active",
        match_threshold=payload.match_threshold
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    total_enrolled = db.query(Student).filter(Student.is_active == True).count()

    return SessionOut(
        id=new_session.id,
        course_id=new_session.course_id,
        course_name=course.course_name,
        course_code=course.course_code,
        session_title=new_session.session_title,
        session_date=new_session.session_date,
        start_time=new_session.start_time,
        end_time=new_session.end_time,
        status=new_session.status,
        match_threshold=new_session.match_threshold,
        total_present=0,
        total_enrolled=total_enrolled,
        created_at=new_session.created_at
    )


@router.post("/recognize-frame", response_model=FrameRecognitionResponse)
def recognize_and_mark_attendance(payload: FrameRecognitionRequest, db: Session = Depends(get_db)):
    """
    Core AI Endpoint:
    Processes real-time webcam frame, detects all visible faces, matches them against
    biometric embeddings in memory, and immediately marks attendance with anti-duplication lock.
    """
    try:
        bgr_image = decode_base64_image(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    # Make sure cache is populated
    if embedding_cache.matrix is None:
        students = db.query(Student).filter(Student.is_active == True).all()
        embedding_cache.refresh(students)

    detected_boxes = detect_faces(bgr_image)
    recognized_faces: List[RecognizedFace] = []

    for box in detected_boxes:
        x, y, w, h = box
        # Extract embedding vector for this face
        try:
            vec = extract_face_embedding(bgr_image, box)
        except Exception:
            continue

        # Match against database cache
        match = embedding_cache.match(vec, threshold=payload.min_confidence)

        if match:
            student_id = match["student_id"]
            roll_no = match["roll_number"]
            name = match["full_name"]
            conf = match["confidence"]

            attendance_status = "RECOGNIZED"
            message = f"Verified: {name}"

            # If session_id is active, check and mark attendance
            if payload.session_id:
                existing_record = db.query(AttendanceRecord).filter(
                    AttendanceRecord.session_id == payload.session_id,
                    AttendanceRecord.student_id == student_id
                ).first()

                if existing_record:
                    attendance_status = "ALREADY_PRESENT"
                    message = f"{name} is already marked Present"
                else:
                    new_record = AttendanceRecord(
                        session_id=payload.session_id,
                        student_id=student_id,
                        status="PRESENT",
                        confidence_score=conf,
                        verification_method="FACE_AI"
                    )
                    db.add(new_record)
                    try:
                        db.commit()
                        attendance_status = "MARKED"
                        message = f"Attendance Marked: {name} ({roll_no})"
                    except Exception:
                        db.rollback()
                        attendance_status = "ALREADY_PRESENT"
                        message = f"{name} already marked"

            recognized_faces.append(RecognizedFace(
                bounding_box=[x, y, w, h],
                student_id=student_id,
                roll_number=roll_no,
                full_name=name,
                confidence=conf,
                is_recognized=True,
                attendance_status=attendance_status,
                message=message
            ))
        else:
            recognized_faces.append(RecognizedFace(
                bounding_box=[x, y, w, h],
                student_id=None,
                roll_number=None,
                full_name="Unregistered Person",
                confidence=0.0,
                is_recognized=False,
                attendance_status="UNKNOWN",
                message="Face not recognized in student database"
            ))

    return FrameRecognitionResponse(
        success=True,
        faces_detected=len(detected_boxes),
        faces=recognized_faces,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/records", response_model=List[RecordOut])
def list_records(
    session_id: Optional[int] = None,
    student_id: Optional[int] = None,
    date_str: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve filtered attendance records."""
    query = db.query(AttendanceRecord).join(Student).order_by(AttendanceRecord.marked_at.desc())

    if session_id:
        query = query.filter(AttendanceRecord.session_id == session_id)
    if student_id:
        query = query.filter(AttendanceRecord.student_id == student_id)
    if date_str:
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.join(AttendanceSession).filter(AttendanceSession.session_date == d)
        except ValueError:
            pass

    records = query.limit(200).all()

    return [
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
        for r in records
    ]


@router.post("/records", response_model=RecordOut)
def manual_mark_attendance(payload: RecordCreate, db: Session = Depends(get_db)):
    """Allow faculty to manually mark or adjust a student's attendance."""
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == payload.session_id,
        AttendanceRecord.student_id == payload.student_id
    ).first()

    if record:
        record.status = payload.status
        record.verification_method = "MANUAL_OVERRIDE"
        record.remarks = payload.remarks or "Updated by Faculty"
    else:
        record = AttendanceRecord(
            session_id=payload.session_id,
            student_id=payload.student_id,
            status=payload.status,
            confidence_score=1.0,
            verification_method="MANUAL_OVERRIDE",
            remarks=payload.remarks or "Manually marked by Faculty"
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    return RecordOut(
        id=record.id,
        session_id=record.session_id,
        student_id=record.student_id,
        student_roll=record.student.roll_number,
        student_name=record.student.full_name,
        student_photo=record.student.photo_url,
        marked_at=record.marked_at,
        status=record.status,
        confidence_score=record.confidence_score,
        verification_method=record.verification_method,
        remarks=record.remarks
    )


@router.get("/export-csv")
def export_attendance_csv(session_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Export attendance data to formatted university-standard CSV."""
    query = db.query(AttendanceRecord).join(Student).join(AttendanceSession)
    if session_id:
        query = query.filter(AttendanceRecord.session_id == session_id)

    records = query.order_by(Student.roll_number.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Session Title", "Session Date", "Roll Number",
        "Student Name", "Department", "Semester", "Status",
        "Marked Time", "Verification Method", "Confidence Score"
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.session.session_title if r.session else "N/A",
            r.session.session_date.strftime("%Y-%m-%d") if r.session and r.session.session_date else "N/A",
            r.student.roll_number,
            r.student.full_name,
            r.student.department,
            r.student.semester,
            r.status,
            r.marked_at.strftime("%Y-%m-%d %H:%M:%S"),
            r.verification_method,
            f"{int(r.confidence_score * 100)}%"
        ])

    output.seek(0)
    filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
