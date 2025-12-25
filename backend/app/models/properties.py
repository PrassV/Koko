from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    owner = relationship("User", back_populates="properties")
    units = relationship("Unit", back_populates="property")

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    unit_number = Column(String, nullable=False)
    specifications = Column(JSON, nullable=True)  # e.g., {"bhk": 2, "sqft": 1000}
    images = Column(JSON, nullable=True) # List of image URLs
    
    property = relationship("Property", back_populates="units")
    tenancy = relationship("Tenancy", back_populates="unit", uselist=False) # Current active tenancy? Or history?
    # For history, we might want one-to-many. Let's do one-to-many for history ledger.
    tenancies = relationship("Tenancy", back_populates="unit")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="unit")
    payments = relationship("Payment", back_populates="unit")
    documents = Column(JSON, nullable=True) # List of {"name": "doc", "url": "..."}
