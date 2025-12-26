from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, Float, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String, nullable=True) # e.g. Apartment, House
    units_count = Column(Integer, default=1)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)

    owner = relationship("User", back_populates="properties")
    units = relationship("Unit", back_populates="property")

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    unit_number = Column(String, nullable=False)
    specifications = Column(JSON, nullable=True)  # e.g., {"bhk": 2, "sqft": 1000}
    images = Column(JSON, nullable=True) # List of image URLs
    size_sqft = Column(Float, nullable=True)
    facing = Column(String, nullable=True) # e.g. North, East
    construction_date = Column(Date, nullable=True)
    
    property = relationship("Property", back_populates="units")
    tenancy = relationship("Tenancy", back_populates="unit", uselist=False, overlaps="tenancies") # Current active tenancy
    # For history, we might want one-to-many. Let's do one-to-many for history ledger.
    tenancies = relationship("Tenancy", back_populates="unit", overlaps="tenancy")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="unit")
    payments = relationship("Payment", back_populates="unit")
    documents = Column(JSON, nullable=True) # List of {"name": "doc", "url": "..."}
