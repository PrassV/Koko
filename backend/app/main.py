from fastapi import FastAPI
from app.database import engine, Base
import firebase_admin
from firebase_admin import credentials
import json
import os
from app.config import settings

from app.routers import auth, properties, tenancy, maintenance, finance, storage, admin, owner

from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check Database Connection
    print("Startup: Checking database connection...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("Startup: Database connection SUCCESS")
    except Exception as e:
        print(f"Startup: Database connection FAILED: {e}")
        raise e # Fail fast so we see the error in logs immediately
    
    yield
    
    # Shutdown logic if needed
    print("Shutdown: Application stopping")

app = FastAPI(title="Property Management Portal", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://koko-two-zeta.vercel.app",
    "https://propo.vercel.app",
    "https://koko-production-1965.up.railway.app"
]

# Add FRONTEND_URL from environment if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)
    
# Also support comma-separated ALLOWED_ORIGINS
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    for origin in extra_origins.split(","):
        origin = origin.strip()
        if origin and origin not in origins:
            origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
if settings.FIREBASE_CREDENTIALS_JSON:
    # Fail fast if credentials are invalid
    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    print("Firebase initialized successfully")
else:
    print("Warning: No FIREBASE_CREDENTIALS_JSON provided")

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(tenancy.router)
app.include_router(maintenance.router)
app.include_router(finance.router)
app.include_router(storage.router)
app.include_router(admin.router)
app.include_router(owner.router)

@app.get("/")
def read_root():
    return {"message": "Property Management Portal API is running"}

@app.get("/health")
async def health_check():
    db_status = "unknown"
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "online",
        "database": db_status,
        "firebase": "initialized" if firebase_admin._apps else "not_initialized"
    }
