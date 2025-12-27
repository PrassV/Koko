from sqlalchemy import Column, Integer, ForeignKey, Float, Date, String
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class PaymentType(str, enum.Enum):
    RENT = "RENT"
    LEASE = "LEASE"  # Lump sum payment
    ADVANCE = "ADVANCE"
    MAINTENANCE = "MAINTENANCE"
    TAX = "TAX"
    EB = "EB"
    OTHER = "OTHER"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    # Tenancy is optional now, because TAX/EB might not be linked to a tenancy but to a property/unit
    tenancy_id = Column(Integer, ForeignKey("tenancies.id"), nullable=True)
    # New: Link payment to Unit explicitly if it's a generic expense like Tax/EB? 
    # For simplicity, Owner can link generic expenses to a Unit.
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    
    amount = Column(Float, nullable=False)
    payment_type = Column(String, nullable=False)
    payment_date = Column(Date, nullable=False)
    status = Column(String, default="PAID") # PENDING, PAID, FAILED
    
    tenancy = relationship("Tenancy", back_populates="payments")
    unit = relationship("Unit", back_populates="payments")
