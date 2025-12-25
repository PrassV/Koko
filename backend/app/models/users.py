from sqlalchemy import Column, Integer, String, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    TENANT = "TENANT"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # Stored as string, validated as Enum in logic
    name = Column(String, nullable=True)
    documents = Column(JSON, nullable=True) # e.g. [{"type": "ID", "url": "..."}]
    
    # Relationships
    properties = relationship("Property", back_populates="owner")
    tenancies = relationship("Tenancy", back_populates="tenant")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="tenant")
