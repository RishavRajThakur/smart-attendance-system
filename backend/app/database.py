"""
Database configuration supporting SQLite (local dev/viva demo) 
and PostgreSQL (cloud deployment on Render/Supabase).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default to SQLite local database file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")

# Fix Render PostgreSQL URL prefix if necessary (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency to provide a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Ensure newly introduced columns exist in SQLite database without losing data."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    from sqlalchemy import text
    with engine.connect() as conn:
        # Check users table
        try:
            result = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in result.fetchall()]
            if "department" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(50) DEFAULT 'Computer Science'"))
            if "designation" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN designation VARCHAR(100) DEFAULT 'Assistant Professor'"))
            if "phone" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
            if "photo_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN photo_url VARCHAR(255)"))
        except Exception as e:
            print(f"[Migration Notice] users table: {e}")

        # Check courses table
        try:
            result = conn.execute(text("PRAGMA table_info(courses)"))
            cols = [row[1] for row in result.fetchall()]
            if "faculty_id" not in cols:
                conn.execute(text("ALTER TABLE courses ADD COLUMN faculty_id INTEGER REFERENCES users(id)"))
        except Exception as e:
            print(f"[Migration Notice] courses table: {e}")

        # Check students table
        try:
            result = conn.execute(text("PRAGMA table_info(students)"))
            cols = [row[1] for row in result.fetchall()]
            if "password_hash" not in cols:
                conn.execute(text("ALTER TABLE students ADD COLUMN password_hash VARCHAR(255)"))
        except Exception as e:
            print(f"[Migration Notice] students table: {e}")
        conn.commit()

