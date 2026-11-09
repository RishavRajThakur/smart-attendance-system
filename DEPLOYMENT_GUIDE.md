# Complete Step-by-Step Deployment Guide
## AI-Powered Smart Attendance System (KIIT Deemed to be University)

This guide walks you through deploying your system so anyone (or your viva evaluators) can access it online from a laptop or mobile phone.

---

## 📌 Deployment Options Overview

| Method | Best For | Cost | Effort | Live URL Example |
| :--- | :--- | :---: | :---: | :--- |
| **Option 1: Render.com (Docker)** | Permanent cloud deployment (all-in-one) | **Free** | 5 mins | `https://smart-attendance.onrender.com` |
| **Option 2: Railway.app** | High performance & persistent disk | **Free trial** | 3 mins | `https://smart-attendance.up.railway.app` |
| **Option 3: Ngrok HTTPS Tunnel** | **Instant Viva Defense & Phone Demo** | **Free** | 30 secs | `https://xxxx.ngrok-free.app` |

---

## 🚀 Option 1: Full Cloud Deployment on Render.com (Recommended)

Render can build and host your entire application (both Vite Frontend and FastAPI FaceNet Backend) as a single container using the `Dockerfile` in the root folder.

### Step 1: Push your project to GitHub
If you haven't pushed this project to GitHub yet:
1. Go to [GitHub.com](https://github.com) and click **New Repository**.
2. Name it (e.g., `smart-attendance-system`) and choose **Public** or **Private**.
3. In your PowerShell terminal, run:
   ```powershell
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/smart-attendance-system.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create a Web Service on Render
1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** (top right) ➔ Select **Web Service**.
3. Under *Connect a repository*, choose your `smart-attendance-system` repository.
4. Set the parameters:
   - **Name**: `smart-attendance-system`
   - **Region**: *Singapore* or *Frankfurt*
   - **Environment / Runtime**: Select **Docker**
   - **Instance Type**: Select **Free**
5. Click **Deploy Web Service**!

Render will automatically:
- Build the React Vite UI.
- Install PyTorch and FaceNet biometric engine.
- Launch the unified application at `https://<your-app>.onrender.com`.

---

## ⚡ Option 2: Instant 30-Second Live Demo via Ngrok (Best for Viva Defense)

If you need a public URL **right now** for your viva presentation or to let professors test face recognition from their **mobile phones**:

> Mobile browsers (Chrome / Safari on Android & iPhone) require HTTPS for camera/webcam access.  
> An HTTPS tunnel gives you a secure link immediately without configuring servers.

### How to run it:
1. Keep the local system running (ports 5173 & 8000).
2. Open a new PowerShell terminal and run:
   ```powershell
   npx ngrok http 5173
   ```
3. Copy the public link:
   ```
   https://xxxx.ngrok-free.app
   ```
4. Open that link on any phone or laptop—webcam face recognition will work live!
