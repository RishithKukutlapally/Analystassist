# ==============================================================================
# Stage 1: Frontend Builder
# ==============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies with npm ci for deterministic builds
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build production assets
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: FastAPI Runtime
# ==============================================================================
FROM python:3.12-slim

# Copy uv binaries from official Astral image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Set container environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CHASEZERO_FRONTEND_DIR=/app/frontend_dist \
    CHASEZERO_DB_PATH=/tmp/chasezero.db

# Install backend dependencies via uv directly to system Python
COPY backend/pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy backend application source
COPY backend/app ./app

# Copy compiled frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist

# Expose default Cloud Run container port
EXPOSE 8080

# Cloud Run dynamic PORT entrypoint
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
