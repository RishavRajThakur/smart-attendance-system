"""
Authentication Router:
Handles faculty & student login, user profiles, and quick demo credentials for viva.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Student
from ..schemas import LoginRequest, Token, UserOut
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, or student roll number."""
    # Check User table first (Admin / Faculty)
    user = db.query(User).filter(User.email == creds.email).first()
    
    if user and verify_password(creds.password, user.password_hash):
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    
    # Check if student is logging in using roll number
    student = db.query(Student).filter(Student.roll_number == creds.email.strip()).first()
    if student:
        # For student login, allow default password (roll number or student123)
        if creds.password in [student.roll_number, "student123", "password"]:
            token = create_access_token({"sub": student.email or student.roll_number, "role": "student", "id": student.id})
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": "student",
                "user_id": student.id,
                "full_name": student.full_name,
                "email": student.email or f"{student.roll_number}@student.college.edu"
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. For faculty: faculty@college.edu / faculty123. For student: Enter your Roll Number."
    )


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


@router.get("/demo-accounts")
def get_demo_accounts():
    """Return pre-configured demo logins for seamless presentation."""
    return [
        {
            "role": "Faculty (Evaluator)",
            "email": "faculty@college.edu",
            "password": "faculty123",
            "description": "Full access to dashboard, live face scanner, and attendance logs."
        },
        {
            "role": "Student Portal",
            "email": "2021CSE042",
            "password": "student123",
            "description": "Student self-view: personal attendance %, exam eligibility, calendar."
        }
    ]
