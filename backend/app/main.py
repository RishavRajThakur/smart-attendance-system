"""
FastAPI Main Application Entry Point:
AI-Powered Smart Attendance System (7th-Semester B.Tech Major Project).
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal, run_migrations
from .models import Student
from .seed import seed_database
from .services.face_engine import embedding_cache
from .routers import auth, students, attendance, analytics, faculty, courses

# Create database tables & run any column migrations
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(
    title="AI Smart Attendance System API",
    description="Intelligent biometric face recognition attendance management portal for universities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware for modern frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files for student profile pictures
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Register API routers
app.include_router(auth.router)
app.include_router(faculty.router)
app.include_router(courses.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(analytics.router)


@app.on_event("startup")
def startup_event():
    """Seed demo dataset and preload biometric embeddings into memory cache."""
    print("============================================================")
    print("[INFO] Initializing AI Smart Attendance System (FastAPI Backend)...")
    print("============================================================")
    
    # 1. Ensure migrations and seed demo data
    try:
        run_migrations()
        seed_database()
    except Exception as e:
        print(f"[Startup Notice] Seed step: {e}")

    # 2. Warm up biometric in-memory cache
    db = SessionLocal()
    try:
        all_students = db.query(Student).filter(Student.is_active == True).all()
        embedding_cache.refresh(all_students)
        print(f"[SUCCESS] Biometric Cache Loaded: {len(embedding_cache.student_ids)} active student embeddings ready.")
    finally:
        db.close()


# Mount compiled frontend SPA from frontend/dist if available
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    from fastapi.responses import FileResponse

    @app.get("/api-status")
    def api_status():
        """Backend health check status."""
        return {
            "project": "AI-Powered Smart Attendance System",
            "academic_level": "7th-Semester B.Tech CSE Project",
            "status": "Online & Operational",
            "api_documentation": "/docs"
        }

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """Serve frontend SPA and static assets."""
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        """Root status endpoint when frontend dist is not built."""
        return {
            "project": "AI-Powered Smart Attendance System",
            "academic_level": "7th-Semester B.Tech CSE Project",
            "status": "Online & Operational",
            "api_documentation": "/docs"
        }
