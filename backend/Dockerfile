# -----------------------------------------------------------------------------
# Stage 1: install dependencies
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS builder
WORKDIR /build

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -t /deps -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: runtime (no pip, no build tools)
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/deps

COPY --from=builder /deps /app/deps
COPY backend/app ./app

ENV PORT=8000
EXPOSE ${PORT}
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}