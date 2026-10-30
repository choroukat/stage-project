"""
main.py — FIXED VERSION
========================
Main entry point for NTT DATA HR Intelligence Platform backend.

KEY FIX: Scheduler was never started. The lifespan parameter now
wires the APScheduler into FastAPI's startup/shutdown lifecycle,
so email cron jobs run automatically every day.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# ── Import scheduler lifespan (FIX: was missing entirely) ─────
from services.scheduler import lifespan

# ── Import all routers ─────────────────────────────────────────
from routes.auth_routes        import router as auth_router
from routes.employee_routes    import router as employee_router
from routes.certificate_routes import router as certificate_router
from routes.training_routes    import router as training_router
from routes.upload_routes      import router as upload_router
from routes.history_routes     import router as history_router
from routes.general_routes     import router as general_router
from routes.dashboard_routes   import router as dashboard_router
from routes.prediction_routes  import prediction_router

# ── Email routes (inline router) ──────────────────────────────
from fastapi import APIRouter
from services.email_service import (
    send_bulk_expiry_alerts,
    send_daily_issued_certificates,
    get_email_logs,
    send_failed_certificate_email,
    send_expiry_alert_email,
)
from services.scheduler import get_scheduler_status, trigger_job_now

email_router = APIRouter(prefix="/emails", tags=["Email & Alertes"])


@email_router.post("/send-expiry-alerts", summary="Send expiry alerts manually")
def trigger_expiry_alerts(data: dict = {}):
    """Trigger bulk expiry alert emails. Normally runs automatically at 09:00 UTC."""
    days = data.get("days", int(os.getenv("CERT_EXPIRY_ALERT_DAYS", 30)))
    return send_bulk_expiry_alerts(alert_days=days)


@email_router.post("/send-daily-issued", summary="Send issued-today certificate emails")
def trigger_daily_issued():
    """Trigger daily issued-certificate emails. Normally runs automatically at 08:00 UTC."""
    return send_daily_issued_certificates()


@email_router.post("/send-failed", summary="Send failed-certificate notification")
def trigger_failed_email(data: dict):
    """Send a failed certificate notification to an employee."""
    return send_failed_certificate_email(
        to_email      = data.get("email"),
        employee_name = data.get("employee_name"),
        cert_title    = data.get("cert_title"),
        cert_id       = data.get("cert_id", ""),
        score         = data.get("score"),
        exam_date     = data.get("exam_date"),
    )


@email_router.get("/logs", summary="Email logs history")
def get_logs(
    limit: int = 50,
    type: str = None,
    employee: str = None,
):
    """
    Return sent email history.
    Optional filters: type (ISSUED|EXPIRING|FAILED), employee (name search).
    """
    return get_email_logs(limit=limit, email_type=type, employee_name=employee)


@email_router.get("/stats", summary="Email statistics")
def get_email_stats():
    """Return email counts by type and status."""
    all_logs = get_email_logs(limit=1000)
    return {
        "total":    len(all_logs),
        "sent":     sum(1 for l in all_logs if l.get("success") is True),
        "failed":   sum(1 for l in all_logs if l.get("success") is False),
        "issued":   sum(1 for l in all_logs if l.get("type") == "ISSUED"),
        "expiring": sum(1 for l in all_logs if l.get("type") == "EXPIRING"),
    }


@email_router.get("/scheduler-status", summary="Scheduler status")
def scheduler_status():
    """Return scheduler running state and next job execution times."""
    return get_scheduler_status()


@email_router.post("/trigger-job/{job_id}", summary="Manually trigger a scheduler job")
def manual_trigger(job_id: str):
    """
    Force immediate execution of a scheduled job.
    job_id: 'daily_certificates' or 'expiry_alerts'
    """
    return trigger_job_now(job_id)


# ================================================================
# FASTAPI APP (FIX: lifespan= starts/stops the scheduler)
# ================================================================

app = FastAPI(
    title       = "NTT DATA — HR Intelligence Platform API",
    description = """
## API Backend — Plateforme RH intelligente NTT DATA

### Modules :
- 🔐 **Auth** — JWT Authentication
- 👥 **Employees** — Employee management + AI Agent
- 🏆 **Certificates** — Certificate management + AI Agent
- 📚 **Trainings** — Training management + AI Agent
- 🤖 **General Agent** — Cross-data AI assistant
- 📄 **Upload** — CV upload and AI parsing
- 📧 **Emails** — Automated certificate alerts (daily cron)
- 📋 **History** — Action audit trail

### LLM: LLaMA 3 70B via Groq API
    """,
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
    lifespan    = lifespan,   # ← FIX: this starts the scheduler on boot
)


# ── CORS ──────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        FRONTEND_URL,
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register routers ──────────────────────────────────────────
app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(certificate_router)
app.include_router(training_router)
app.include_router(upload_router)
app.include_router(history_router)
app.include_router(email_router)
app.include_router(general_router)
app.include_router(dashboard_router)
app.include_router(prediction_router)

# ── Base endpoints ────────────────────────────────────────────

@app.get("/", tags=["Root"])
def root():
    return {
        "status":  "running",
        "app":     "NTT DATA HR Intelligence Platform",
        "version": "1.0.0",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Root"])
def health_check():
    try:
        from database.mongodb import client
        client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    from services.scheduler import get_scheduler_status
    sched = get_scheduler_status()

    return {
        "status":    "healthy" if db_status == "connected" else "degraded",
        "database":  db_status,
        "scheduler": "running" if sched["running"] else "stopped",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting FastAPI server...")
    logger.info("📖 Docs: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
  



 # uvicorn main:app --reload --host 0.0.0.0 --port 8000

