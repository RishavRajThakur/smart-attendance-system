# ==============================================================================
# Multi-Stage Production Dockerfile for Smart Attendance System
# Stage 1: Builds the React Vite Frontend
# Stage 2: Packages Python FastAPI Backend with PyTorch & FaceNet Engine
# ==============================================================================

# Stage 1: Frontend Build
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.10-slim
WORKDIR /app/backend

# Install OS libraries required by OpenCV and PyTorch Face Recognition
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy backend application source code
COPY backend/ ./

# Copy compiled frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose HTTP port (Render/Railway/Heroku injects PORT environment variable)
ENV PORT=8000
EXPOSE 8000

# Start FastAPI application
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
