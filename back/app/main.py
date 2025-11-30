from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn
import logging

from .config import settings
from .database import engine, get_db
from .models import user
from .routes import auth, users, records, achievements
from .auth import cleanup_expired_sessions

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
    ]
)

logger = logging.getLogger(__name__)

try:
    user.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    from scripts.init_achievements import init_achievements
    logger.info("Starting achievements initialization...")
    init_achievements()
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    raise

app = FastAPI(
    title="Voice Diary API",
    description="Backend API for Voice Diary application with achievements system",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(records.router)
app.include_router(achievements.router)

@app.get("/")
async def root():
    return {
        "message": "Voice Diary API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        
        cleanup_expired_sessions(db)
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )

@app.get("/info")
async def api_info():
    return {
        "name": "Voice Diary API",
        "version": "1.0.0",
        "description": "Backend for voice diary with achievements system",
        "features": [
            "User authentication with JWT",
            "Voice records management",
            "Achievements system",
            "Session management",
            "Emotion tracking"
        ]
    }

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Resource not found", "details": str(exc)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

@app.exception_handler(429)
async def rate_limit_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=429,
        content={"message": "Too many requests"}
    )

# cd back
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
def start():
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        workers=2,  # Количество воркеров
        log_level="info",
        access_log=True,  # Логирование запросов
        proxy_headers=True,  # Для работы за reverse proxy
        forwarded_allow_ips="*"  # Для корректных IP в логах
    )