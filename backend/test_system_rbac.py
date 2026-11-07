"""
Automated RBAC, Logic, and System Verification Script
Tests all roles (Admin, Faculty, Student), endpoint security, session creation,
and privacy isolation.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Student, Course, AttendanceSession, AttendanceRecord

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("RUNNING SMART ATTENDANCE SYSTEM VERIFICATION TESTS")
    print("==================================================")

    # 1. Test Admin Login
    admin_res = client.post("/api/auth/login", json={
        "email": "bsaho@kiit.ac.in",
        "password": "admin123",
        "role": "admin"
    })
    assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
    admin_data = admin_res.json()
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 1. Admin Login: Succeeded with full authority token.")

    # 2. Test Faculty Login
    faculty_res = client.post("/api/auth/login", json={
        "email": "faculty@college.edu",
        "password": "faculty123",
        "role": "faculty"
    })
    assert faculty_res.status_code == 200, f"Faculty login failed: {faculty_res.text}"
    faculty_data = faculty_res.json()
    faculty_token = faculty_data["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    print("[PASS] 2. Faculty Login: Succeeded with instructor token.")

    # 3. Test Student Login
    student_res = client.post("/api/auth/login", json={
        "email": "2103001",
        "password": "student123",
        "role": "student"
    })
    assert student_res.status_code == 200, f"Student login failed: {student_res.text}"
    student_data = student_res.json()
    assert "roll_number" in student_data and student_data["roll_number"] == "2103001", "Student roll_number missing in auth response"
    student_token = student_data["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"[PASS] 3. Student Login: Succeeded for roll {student_data['roll_number']}.")

    # 4. Test Student Privacy: Student CANNOT view another student's portal
    other_student_res = client.get("/api/analytics/student/2021CSE023", headers=student_headers)
    assert other_student_res.status_code == 403, f"Expected 403 for cross-student access, got {other_student_res.status_code}"
    print("[PASS] 4. Student Privacy: Student 2103001 blocked from accessing Ishaan Verma's record (403 Forbidden).")

    # 5. Test Student can view their OWN portal
    own_student_res = client.get("/api/analytics/student/2103001", headers=student_headers)
    assert own_student_res.status_code == 200, f"Expected 200 for own student access, got {own_student_res.status_code}"
    portal_data = own_student_res.json()
    assert "subject_breakdown" in portal_data, "Subject breakdown missing"
    assert "is_eligible_for_exams" in portal_data, "Exam eligibility missing"
    print(f"[PASS] 5. Student Self-Portal: Overall attendance: {portal_data['overall_percentage']}%, Exam Eligible: {portal_data['is_eligible_for_exams']}.")

    # 6. Test Student CANNOT create attendance session
    unauth_session = client.post("/api/attendance/sessions", json={
        "course_id": 1,
        "session_title": "Hacked Session"
    }, headers=student_headers)
    assert unauth_session.status_code == 403, f"Expected 403 for student creating session, got {unauth_session.status_code}"
    print("[PASS] 6. Security Enforcement: Student blocked from creating attendance session (403 Forbidden).")

    # 7. Test Student CANNOT manually mark attendance
    unauth_mark = client.post("/api/attendance/records", json={
        "session_id": 1,
        "student_id": 1,
        "status": "PRESENT"
    }, headers=student_headers)
    assert unauth_mark.status_code == 403, f"Expected 403 for student manual marking, got {unauth_mark.status_code}"
    print("[PASS] 7. Security Enforcement: Student blocked from altering attendance marks (403 Forbidden).")

    # 8. Test Student CANNOT delete students
    unauth_del = client.delete("/api/students/1", headers=student_headers)
    assert unauth_del.status_code == 403, f"Expected 403 for student deleting student, got {unauth_del.status_code}"
    print("[PASS] 8. Security Enforcement: Student blocked from deleting student records (403 Forbidden).")

    # 9. Test Faculty CANNOT delete students (Admin-only authority)
    faculty_del = client.delete("/api/students/1", headers=faculty_headers)
    assert faculty_del.status_code == 403, f"Expected 403 for faculty deleting student, got {faculty_del.status_code}"
    print("[PASS] 9. Security Enforcement: Faculty blocked from deleting students from registry (403 Forbidden).")

    # 10. Test Faculty CAN create attendance session
    new_sess = client.post("/api/attendance/sessions", json={
        "course_id": 1,
        "session_title": "Automated Test Lab Session",
        "match_threshold": 0.65
    }, headers=faculty_headers)
    assert new_sess.status_code == 201, f"Faculty session creation failed: {new_sess.text}"
    created_session_id = new_sess.json()["id"]
    print(f"[PASS] 10. Faculty Session Creation: Successfully created session ID {created_session_id}.")

    # 11. Test Faculty CAN manually adjust student attendance
    manual_res = client.post("/api/attendance/records", json={
        "session_id": created_session_id,
        "student_id": 1,
        "status": "PRESENT",
        "remarks": "Verified by Faculty in viva test"
    }, headers=faculty_headers)
    assert manual_res.status_code == 200, f"Faculty manual mark failed: {manual_res.text}"
    print("[PASS] 11. Faculty Attendance Override: Successfully recorded student attendance.")

    # 12. Test Faculty Isolation: Faculty can ONLY see their own faculty profile
    fac_profile_res = client.get("/api/faculty", headers=faculty_headers)
    assert fac_profile_res.status_code == 200
    fac_list = fac_profile_res.json()
    assert len(fac_list) == 1, f"Faculty saw {len(fac_list)} profiles instead of 1"
    assert fac_list[0]["email"] == "faculty@college.edu", "Faculty saw another member's profile"
    print("[PASS] 12. Faculty Privacy Isolation: Faculty sees strictly 1 profile (their own). Other faculty data hidden.")

    # 13. Test Admin Faculty Directory: Admin sees all faculty members
    admin_fac_res = client.get("/api/faculty", headers=admin_headers)
    assert admin_fac_res.status_code == 200
    admin_fac_list = admin_fac_res.json()
    assert len(admin_fac_list) >= 1, f"Admin expected at least 1 faculty, saw {len(admin_fac_list)}"
    print(f"[PASS] 13. Admin Authority: Admin directory shows all {len(admin_fac_list)} registered faculty members.")

    # 14. Test CSV Export Authentication: Unauthenticated request rejected
    unauth_csv = client.get("/api/attendance/export-csv")
    assert unauth_csv.status_code == 401, f"Expected 401 for unauthenticated CSV export, got {unauth_csv.status_code}"
    print("[PASS] 14. CSV Export Security: Unauthenticated access blocked (401 Unauthorized).")

    # 15. Test CSV Export with Token
    auth_csv = client.get(f"/api/attendance/export-csv?token={admin_token}")
    assert auth_csv.status_code == 200, f"Admin token CSV export failed: {auth_csv.status_code}"
    csv_text = auth_csv.text
    assert "Roll Number" in csv_text and "Student Name" in csv_text, "CSV content format invalid"
    print("[PASS] 15. CSV Export Authentication: Token-based export succeeded with proper headers.")

    # 16. Test Admin Profile Photo Upload & Delete
    sample_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    admin_upload = client.post("/api/auth/profile-photo", json={"photo_base64": sample_b64}, headers=admin_headers)
    assert admin_upload.status_code == 200 and admin_upload.json().get("photo_url"), "Admin photo upload failed"
    admin_del = client.delete("/api/auth/profile-photo", headers=admin_headers)
    assert admin_del.status_code == 200 and admin_del.json().get("photo_url") is None, "Admin photo deletion failed"
    print("[PASS] 16. Admin Profile Photo: Upload & deletion working correctly.")

    # 17. Test Faculty Profile Photo Upload & Delete
    fac_upload = client.post("/api/auth/profile-photo", json={"photo_base64": sample_b64}, headers=faculty_headers)
    assert fac_upload.status_code == 200 and fac_upload.json().get("photo_url"), "Faculty photo upload failed"
    fac_del = client.delete("/api/auth/profile-photo", headers=faculty_headers)
    assert fac_del.status_code == 200 and fac_del.json().get("photo_url") is None, "Faculty photo deletion failed"
    print("[PASS] 17. Faculty Profile Photo: Upload & deletion working correctly.")

    # 18. Test Student Profile Photo Upload & Delete
    stu_upload = client.post("/api/auth/profile-photo", json={"photo_base64": sample_b64}, headers=student_headers)
    assert stu_upload.status_code == 200 and stu_upload.json().get("photo_url"), "Student photo upload failed"
    stu_del = client.delete("/api/auth/profile-photo", headers=student_headers)
    assert stu_del.status_code == 200 and stu_del.json().get("photo_url") is None, "Student photo deletion failed"
    print("[PASS] 18. Student Profile Photo: Upload & deletion working correctly.")

    print("==================================================")
    print("ALL 18 RBAC, SECURITY, LOGIC & PHOTO TESTS PASSED CLEANLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
