from sqlalchemy import Column, Integer, ForeignKey, Date, Boolean, String, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Tenancy(Base):
    __tablename__ = "tenancies"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="ACTIVE") # ACTIVE, NOTICE, HISTORIC
    vacation_notice_date = Column(Date, nullable=True)

    rent_amount = Column(Float, nullable=False)
    advance_amount = Column(Float, nullable=True)
    agreement_url = Column(String, nullable=True)
    
    unit = relationship("Unit", back_populates="tenancies")
    tenant = relationship("User", back_populates="tenancies")
    payments = relationship("Payment", back_populates="tenancy")
