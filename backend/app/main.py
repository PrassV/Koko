from fastapi import FastAPI
from app.database import engine, Base
import firebase_admin
from firebase_admin import credentials
import json
import os
from app.config import settings

from app.routers import auth, properties, tenancy, maintenance, finance, storage, admin

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Property Management Portal")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
if settings.FIREBASE_CREDENTIALS_JSON:
    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
else:
    # Just a warning or pass
    pass

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(tenancy.router)
app.include_router(maintenance.router)
app.include_router(finance.router)
app.include_router(storage.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Property Management Portal API is running"}
