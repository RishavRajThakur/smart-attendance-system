# 🎯 AI-Powered Smart Attendance System using Face Recognition

> **Academic Level**: 7th-Semester B.Tech Computer Science & Engineering (Major Capstone Project)  
> **Core Architecture**: FastAPI + OpenCV + Deep Metric Biometric Embeddings + React (Vite & Tailwind CSS) + SQLite

---

## 📌 Project Highlights

- **Real-Time Facial Biometric Attendance**: Webcam stream with face detection, deep embedding feature extraction, and cosine similarity matching.
- **Anti-Duplicate Attendance Lock**: Automatic duplicate rejection within the same session/date.
- **University 75% Attendance Defaulter Radar**: Automatically tracks and flags students falling below statutory university attendance guidelines.
- **Dual-Role Web Portal**:
  - **Faculty / Admin**: Command dashboard, live kiosk scanner, student biometric enrollment, attendance logs with manual overrides, and CSV reports.
  - **Student Self-Portal**: Attendance percentage dial, exam eligibility check, and course-by-course breakdown.
- **Zero-Config Portability**: Uses local SQLite by default (`attendance.db`), allowing 100% offline demonstration during viva without relying on external cloud databases.

---

## 🚀 1-Click Launch (Viva Demonstration)

Double-click `run_system.bat` in the project root folder. It automatically boots the backend and frontend dev servers and opens the portal in your browser:

- **Web Portal**: [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Demo Credentials:
- **Faculty / Evaluator**: `faculty@college.edu` / `faculty123`
- **Student Portal**: `2021CSE042` / `student123`

*(The login screen also includes convenient **1-Click Demo Fill buttons** for effortless viva presentation).*

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
│   │       ├── auth.py           # Login & user profiles
│   │       ├── students.py       # Student enrollment & biometric registration
│   │       ├── attendance.py     # Live frame recognition & CSV export
│   │       └── analytics.py      # KPI metrics & 75% defaulter audit
│   ├── attendance.db             # Local SQLite database
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Client-side router & navigation state
│   │   ├── api.ts                # Backend API client
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Top status bar & user profile
│   │   │   └── Sidebar.tsx       # Navigation menu
│   │   └── pages/
│   │       ├── LoginPage.tsx          # Dual-role login with 1-click viva fills
│   │       ├── DashboardPage.tsx      # Faculty analytics & weekly trend chart
│   │       ├── LiveKioskPage.tsx      # Live webcam classroom scanner with canvas overlay
│   │       ├── StudentRegistryPage.tsx# Student directory with webcam 3-shot enrollment
│   │       ├── AttendanceRecordsPage.tsx# Audit records, status toggles, & CSV export
│   │       ├── DefaultersPage.tsx     # 75% university rule audit & advisory dispatch
│   │       └── StudentPortalPage.tsx  # Student personal attendance & exam eligibility
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
