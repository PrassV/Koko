from sqlalchemy import Column, Integer, ForeignKey, Date, Boolean, String, Float, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Tenancy(Base):
    __tablename__ = "tenancies"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for offline tenants
    
    # Payment Structure: "LEASE" (lump sum) or "RENT" (periodic)
    payment_structure = Column(String, nullable=False, default="RENT")
    
    # For LEASE (lump sum payment)
    lease_amount = Column(Float, nullable=True)
    
    # For RENT (periodic payment)
    rent_amount = Column(Float, nullable=True)
    
    # Offline Tenant Details
    tenant_name = Column(String, nullable=True)
    tenant_email = Column(String, nullable=True)
    tenant_phone = Column(String, nullable=True)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="ACTIVE") # ACTIVE, NOTICE, HISTORIC
    vacation_notice_date = Column(Date, nullable=True)

    advance_amount = Column(Float, nullable=True)
    agreement_url = Column(String, nullable=True)
    
    # Check constraint for mutual exclusivity
    __table_args__ = (
        CheckConstraint(
            "(payment_structure = 'LEASE' AND lease_amount IS NOT NULL AND rent_amount IS NULL) OR "
            "(payment_structure = 'RENT' AND rent_amount IS NOT NULL AND lease_amount IS NULL)",
            name="check_payment_structure_amounts"
        ),
    )
    
    unit = relationship("Unit", back_populates="tenancies")
    tenant = relationship("User", back_populates="tenancies")
    payments = relationship("Payment", back_populates="tenancy")

