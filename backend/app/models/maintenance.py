from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class RequestStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional if raised by owner for empty unit
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Who actually reported it (Owner or Tenant)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    images = Column(JSON, nullable=True)
    status = Column(String, default=RequestStatus.OPEN.value)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    unit = relationship("Unit", back_populates="maintenance_requests")
    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="maintenance_requests_as_tenant")
    reported_by = relationship("User", foreign_keys=[reported_by_id], back_populates="maintenance_requests_reported")
    comments = relationship("MaintenanceComment", back_populates="request", cascade="all, delete-orphan")

class MaintenanceComment(Base):
    __tablename__ = "maintenance_comments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("maintenance_requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request = relationship("MaintenanceRequest", back_populates="comments")
    user = relationship("User") # To know who commented
