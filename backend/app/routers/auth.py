"""
Authentication Router:
Handles faculty & student login, user profiles, and quick demo credentials for viva.
"""

import os
import base64
import time
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Student
from ..schemas import LoginRequest, Token, UserOut, ProfilePhotoRequest
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email/roll number and password for exact role: admin, faculty, student."""
    requested_role = creds.role.lower().strip() if creds.role else None
    email_or_roll = creds.email.strip()

    # 1. Admin Role Login
    if requested_role == "admin":
        user = db.query(User).filter(User.email.ilike(email_or_roll)).first()
        if not user:
            student_check = db.query(Student).filter(
                (Student.roll_number.ilike(email_or_roll)) | (Student.email.ilike(email_or_roll))
            ).first()
            if student_check:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="This is a Student ID. Please select the 'Student' tab to log in."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin account not found. Please check your administrator email."
            )
        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account does not have Administrator privileges. Please select the 'Faculty' tab."
            )
        if not verify_password(creds.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password for Administrator account."
            )
        token = create_access_token({"sub": user.email, "role": "admin", "id": user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "admin",
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": getattr(user, "department", "Administration"),
            "designation": getattr(user, "designation", "System Administrator & HOD"),
            "photo_url": getattr(user, "photo_url", None)
        }

    # 2. Faculty Role Login
    if requested_role == "faculty":
        user = db.query(User).filter(User.email.ilike(email_or_roll)).first()
        if not user:
            student_check = db.query(Student).filter(
                (Student.roll_number.ilike(email_or_roll)) | (Student.email.ilike(email_or_roll))
            ).first()
            if student_check:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="This is a Student ID. Please select the 'Student' tab to log in."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Faculty member account not found. Please check your Faculty ID / Email."
            )
        if user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This is an Administrator account. Please select the 'Admin' tab to log in."
            )
        elif user.role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account is not registered as Faculty."
            )
        if not verify_password(creds.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password for Faculty account."
            )
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": getattr(user, "department", "Computer Science"),
            "designation": getattr(user, "designation", "Faculty Instructor"),
            "photo_url": getattr(user, "photo_url", None)
        }

    # 3. Student Role Login
    if requested_role == "student":
        student = db.query(Student).filter(
            (Student.roll_number.ilike(email_or_roll)) |
            (Student.email.ilike(email_or_roll))
        ).first()

        if not student:
            user_check = db.query(User).filter(User.email.ilike(email_or_roll)).first()
            if user_check:
                target_tab = "Admin" if user_check.role == "admin" else "Faculty"
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"This is an employee account. Please select the '{target_tab}' tab to log in."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"No student record found with Student ID / Roll Number '{email_or_roll}'."
            )

        # Verify password: if student has custom password_hash check it, otherwise accept roll number or student123 or password
        pwd_valid = False
        if student.password_hash:
            pwd_valid = verify_password(creds.password, student.password_hash)
        else:
            pwd_valid = creds.password in [student.roll_number, "student123", "password", "123456"]

        if not pwd_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Student password."
            )

        token = create_access_token({"sub": student.roll_number, "role": "student", "id": student.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "student",
            "user_id": student.id,
            "full_name": student.full_name,
            "email": student.email or f"{student.roll_number}@student.college.edu",
            "roll_number": student.roll_number,
            "department": student.department,
            "designation": f"Student • Semester {student.semester} ({student.section})",
            "photo_url": getattr(student, "photo_url", None)
        }

    # 4. Fallback if role is unspecified
    user = db.query(User).filter(User.email.ilike(email_or_roll)).first()
    if user and verify_password(creds.password, user.password_hash):
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": getattr(user, "department", "Computer Science"),
            "designation": getattr(user, "designation", "Faculty"),
            "photo_url": getattr(user, "photo_url", None)
        }

    student = db.query(Student).filter(
        (Student.roll_number.ilike(email_or_roll)) |
        (Student.email.ilike(email_or_roll))
    ).first()
    if student:
        pwd_valid = False
        if student.password_hash:
            pwd_valid = verify_password(creds.password, student.password_hash)
        else:
            pwd_valid = creds.password in [student.roll_number, "student123", "password"]
        if pwd_valid:
            token = create_access_token({"sub": student.roll_number, "role": "student", "id": student.id})
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "student",
                "user_id": student.id,
                "full_name": student.full_name,
                "email": student.email or f"{student.roll_number}@student.college.edu",
                "department": student.department,
                "designation": f"Student • Semester {student.semester}",
                "photo_url": getattr(student, "photo_url", None)
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Please verify your email / Roll Number and password."
    )


@router.get("/me")
def get_profile(current_user: Any = Depends(get_current_user)):
    """Get current authenticated user profile."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = getattr(current_user, "role", "student")
    return {
        "id": current_user.id,
        "email": getattr(current_user, "email", None) or f"{getattr(current_user, 'roll_number', '')}@student.college.edu",
        "full_name": current_user.full_name,
        "role": role,
        "roll_number": getattr(current_user, "roll_number", None),
        "department": getattr(current_user, "department", "Computer Science"),
        "designation": getattr(current_user, "designation", None),
        "phone": getattr(current_user, "phone", None),
        "photo_url": getattr(current_user, "photo_url", None),
        "created_at": getattr(current_user, "created_at", None)
    }


@router.post("/profile-photo")
def update_profile_photo(
    req: ProfilePhotoRequest,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or update profile photo for current user (Admin, Faculty, or Student)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    data = req.photo_base64
    if "," in data:
        data = data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    static_profiles_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static", "uploads", "profiles"))
    os.makedirs(static_profiles_dir, exist_ok=True)

    role = getattr(current_user, "role", "student")
    user_id = current_user.id
    filename = f"avatar_{role}_{user_id}_{int(time.time())}.jpg"
    filepath = os.path.join(static_profiles_dir, filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    photo_url = f"/static/uploads/profiles/{filename}"

    if role == "student":
        student = db.query(Student).filter(Student.id == user_id).first()
        if student:
            student.photo_url = photo_url
            db.commit()
    else:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.photo_url = photo_url
            db.commit()

    return {"success": True, "photo_url": photo_url}


@router.delete("/profile-photo")
def remove_profile_photo(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove custom profile photo and revert to default avatar for current user."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    role = getattr(current_user, "role", "student")
    user_id = current_user.id

    if role == "student":
        student = db.query(Student).filter(Student.id == user_id).first()
        if student:
            student.photo_url = None
            db.commit()
    else:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.photo_url = None
            db.commit()

    return {"success": True, "photo_url": None}


@router.get("/demo-accounts")
def get_demo_accounts():
    """Return pre-configured demo logins for all three roles."""
    return [
        {
            "role": "Admin",
            "email": "admin@college.edu",
            "password": "admin123",
            "description": "Administrator"
        },
        {
            "role": "Faculty",
            "email": "faculty@college.edu",
            "password": "faculty123",
            "description": "Faculty"
        },
        {
            "role": "Student",
            "email": "2103001",
            "password": "student123",
            "description": "Student"
        }
    ]
