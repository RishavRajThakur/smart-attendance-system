# 🎯 AI-Powered Smart Attendance System using Face Recognition

> **Academic Level**: 7th-Semester B.Tech Computer Science & Engineering (Major Capstone Project)  
> **Core Architecture**: FastAPI + OpenCV + Deep Metric Biometric Embeddings + React (Vite & Tailwind CSS) + SQLite

---

## 📌 Project Highlights

- **Real-Time Facial Biometric Attendance**: Webcam stream with face detection, deep embedding feature extraction, and cosine similarity matching.
- **Anti-Duplicate Attendance Lock**: Automatic duplicate rejection within the same session/date.
- **University 75% Attendance Defaulter Radar**: Automatically tracks and flags students falling below statutory university attendance guidelines.
- **Three-Tier Role-Based Access Control (RBAC)**:
  - **Admin**: Full institutional authority. Views and manages all system data, faculty members, students, academic subjects/courses, and faculty credentials (view and reset faculty User ID and passwords).
  - **Faculty**: Restricted strictly to their own teaching portfolio. Only sees their own faculty profile (no access to other faculty data/credentials), views assigned courses and students, conducts live AI attendance, and tracks defaulters.
  - **Student**: Secure access strictly to their own personal attendance metrics, biometric verification logs, and semester eligibility breakdown.
- **Zero-Config Portability**: Uses local SQLite by default (`attendance.db`), allowing 100% offline demonstration during viva without relying on external cloud databases.

---

## 🚀 1-Click Launch (Viva Demonstration)

Double-click `run_system.bat` in the project root folder. It automatically boots the backend and frontend dev servers and opens the portal in your browser:

- **Web Portal**: [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Demo Credentials by Role:
1. **Admin Portal**:
   - User ID: `admin@college.edu`
   - Password: `admin123`
   - Permissions: Master control, Faculty Directory & Password Reset, Subject/Course Management, Full Student Registry, Full Audit Records.
2. **Faculty Portal**:
   - Faculty 1: `faculty@college.edu` / `faculty123` (Prof. Manas Ranjan Biswal)
   - Faculty 2: `ananya.sen@college.edu` / `faculty123` (Dr. Ananya Sen)
   - Permissions: Restricted self-view (cannot view other faculty members' profiles), assigned course & student view, live attendance kiosk.
3. **Student Portal**:
   - Roll Number / User ID: `2103001` (Aman Kumar) or `2021CSE042` (Rahul Sharma)
   - Password: `student123`
   - Permissions: Private attendance history, course-by-course attendance percentage, semester exam eligibility status.

*(The login screen also features 1-Click Demo Fill cards for instant role demonstration).*

---

## 📁 Project Structure

```
smart-attendance-system/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, static mounts, CORS, startup seeding
│   │   ├── database.py           # SQLite/PostgreSQL connection engine
│   │   ├── models.py             # 3NF relational models (Users, Students, Sessions, Records)
│   │   ├── schemas.py            # Pydantic validation schemas
│   │   ├── auth.py               # JWT authentication & password hashing
│   │   ├── seed.py               # Demo database seeder (15 biometric student profiles)
│   │   ├── services/
│   │   │   └── face_engine.py    # OpenCV Haar + FaceNet deep metric embedding matcher
│   │   └── routers/
│   │       ├── auth.py           # Login, profile & photo management
│   │       ├── students.py       # Student directory & face enrollment
│   │       ├── attendance.py     # Live face recognition, manual attendance & CSV export
│   │       ├── analytics.py      # Attendance statistics & defaulter audit
│   │       ├── faculty.py        # Faculty management & privacy isolation
│   │       └── courses.py        # Course & subject curriculum management
│   ├── attendance.db             # Local SQLite database
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Client-side router & navigation state
│   │   ├── api.ts                # Backend API client
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── utils/                # Avatar helper & fallback utilities
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Top status bar & user profile
│   │   │   └── Sidebar.tsx       # Navigation menu by role
│   │   └── pages/
│   │       ├── LoginPage.tsx          # Clean multi-role login
│   │       ├── DashboardPage.tsx      # Analytics & attendance trends
│   │       ├── LiveKioskPage.tsx      # Face Attendance & Manual Attendance
│   │       ├── StudentRegistryPage.tsx# Student directory with enrollment
│   │       ├── FacultyPage.tsx        # Faculty directory & course assignments
│   │       ├── CoursesPage.tsx        # Course curriculum management
│   │       ├── AttendanceRecordsPage.tsx# Attendance records & CSV export
│   │       ├── DefaultersPage.tsx     # Attendance compliance & defaulter report
│   │       ├── SettingsPage.tsx       # User profile photo & system settings
│   │       └── StudentPortalPage.tsx  # Student personal attendance & eligibility
│   ├── vite.config.ts            # Vite proxy configuration
│   └── package.json
│
├── run_system.bat                # 1-Click batch launcher
└── README.md
```

---

## 🔬 Mathematical Principles for Viva Evaluation

1. **Face Detection**: Localizes bounding box coordinates $(x, y, w, h)$ using Haar cascades or Deep Neural Networks.
2. **Deep Metric Embedding**: Maps a normalized face crop into a continuous unit vector $\mathbf{x} \in \mathbb{R}^{d}, \|\mathbf{x}\|_2 = 1$ using Triplet Loss.
3. **Similarity Comparison**:
   $$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
   Threshold is calibrated at $\ge 0.60$ for positive identification.
4. **Laplacian Blur Quality Filter**: Computes variance of the Laplacian operator $\sigma^2 = \text{Var}(\nabla^2 I)$ to reject blurry frames or degraded camera angles.
