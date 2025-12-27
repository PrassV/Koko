from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Property, Unit, User
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/properties", tags=["Properties"])

class PropertyCreate(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    property_type: Optional[str] = None
    units_count: Optional[int] = 1
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    amenities: List[str] = []
    images: List[str] = []
    documents: List[dict] = [] # [{"name": "doc", "url": "..."}]

class UnitCreate(BaseModel):
    unit_number: str
    specifications: Optional[dict] = None # JSON
    size_sqft: Optional[float] = None
    facing: Optional[str] = None
    construction_date: Optional[date] = None
    status: str = "VACANT"

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_property(
    prop_data: PropertyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "OWNER" and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Owners can create properties")
    
    new_prop = Property(
        owner_id=user.id,
        name=prop_data.name,
        address=prop_data.address,
        description=prop_data.description,
        property_type=prop_data.property_type,
        units_count=prop_data.units_count,
        location_lat=prop_data.location_lat,
        location_lng=prop_data.location_lng,
        amenities=prop_data.amenities,
        images=prop_data.images,
        documents=prop_data.documents
    )
    db.add(new_prop)
    await db.commit()
    await db.refresh(new_prop)
    return new_prop

@router.get("/")
async def get_my_properties(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # If admin, maybe return all?
    if user.role == "ADMIN":
        result = await db.execute(select(Property))
    else:
        result = await db.execute(select(Property).where(Property.owner_id == user.id))
    return result.scalars().all()

@router.get("/{property_id}")
async def get_property(
    property_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Eager load units
    from sqlalchemy.orm import selectinload
    
    query = (
        select(Property)
        .options(selectinload(Property.units))
        .where(Property.id == property_id)
    )
    result = await db.execute(query)
    prop = result.scalars().first()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    if prop.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return prop

@router.patch("/{property_id}/documents")
async def update_property_documents(
    property_id: int,
    documents: List[dict], # [{"name": "deed", "url": "..."}]
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalars().first()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    prop.documents = documents
    await db.commit()
    await db.refresh(prop)
    return prop

@router.post("/{property_id}/units")
async def create_unit(
    property_id: int,
    unit_data: UnitCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify ownership
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_unit = Unit(
        property_id=property_id,
        unit_number=unit_data.unit_number,
        specifications=unit_data.specifications,
        size_sqft=unit_data.size_sqft,
        facing=unit_data.facing,
        construction_date=unit_data.construction_date,
        status=unit_data.status
    )
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)
    return new_unit

@router.get("/{property_id}/analytics")
async def get_property_analytics(
    property_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Imports inside function to avoid circular deps if any, or just for cleanliness
    from sqlalchemy import func, and_, desc, extract
    from datetime import datetime, timedelta
    from app.models import Tenancy, Payment, MaintenanceRequest, Unit
    from app.schemas_analytics import PropertyAnalytics, OccupancyStats, FinancialStats, MonthlyRevenue, AlertItem

    # 1. Verify Ownership
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Occupancy Stats
    units_result = await db.execute(select(Unit).where(Unit.property_id == property_id))
    units = units_result.scalars().all()
    
    total_units = len(units)
    occupied = sum(1 for u in units if u.status == "OCCUPIED")
    vacant = sum(1 for u in units if u.status == "VACANT")
    maintenance = sum(1 for u in units if u.status == "UNDER_MAINTENANCE")

    occupancy_stats = OccupancyStats(
        total_units=total_units,
        occupied=occupied,
        vacant=vacant,
        under_maintenance=maintenance
    )

    # 3. Financials
    # Get all unit IDs for this property
    unit_ids = [u.id for u in units]
    
    # Active Tenancies for Projected Rent
    active_tenancies_result = await db.execute(
        select(Tenancy).where(
            and_(Tenancy.unit_id.in_(unit_ids), Tenancy.status == "ACTIVE")
        )
    )
    active_tenancies = active_tenancies_result.scalars().all()
    projected_rent = sum(t.rent_amount for t in active_tenancies)

    # 6 Month Window
    today = date.today()
    six_months_ago = today - timedelta(days=180)

    # Revenue (Payments with type RENT linked to these units/tenancies)
    # Note: Payments might be linked to Tenancy OR Unit.
    # We'll search by Unit ID (via Tenancy or direct Unit link if we supported that, but schema says Tenancy has unit_id)
    # Join Payment -> Tenancy -> Unit
    # Revenue (Payments with type RENT linked to these units/tenancies)
    # Join Payment -> Tenancy -> Unit
    revenue_query = (
        select(Payment)
        .join(Tenancy, Payment.tenancy_id == Tenancy.id)
        .where(
            and_(
                Tenancy.unit_id.in_(unit_ids),
                Payment.payment_type == "RENT",
                Payment.payment_date >= six_months_ago
            )
        )
    )
    revenue_result = await db.execute(revenue_query)
    payments = revenue_result.scalars().all()
    
    # Process Monthly Revenue in Python (SQLite doesn't support date_trunc easily)
    monthly_map = {}
    total_revenue_6m = 0.0
    
    for pay in payments:
        m_key = (pay.payment_date.year, pay.payment_date.month)
        monthly_map[m_key] = monthly_map.get(m_key, 0.0) + pay.amount
        total_revenue_6m += pay.amount

    monthly_revenue = []
    # Ensure all 6 months are present even if 0
    for i in range(5, -1, -1):
        d = today - timedelta(days=30*i)
        key = (d.year, d.month)
        amount = monthly_map.get(key, 0.0)
        monthly_revenue.append(MonthlyRevenue(
            month=d.strftime("%b"),
            year=d.year,
            amount=amount
        ))

    # Maintenance Spend query
    # Payment -> Unit directly (if definition allows) or Pay -> MaintenanceRequest -> Unit
    # Current finance.py schema: Payment -> Tenancy. 
    # Wait, finance.py: unit_id is nullable. If it's maintenance, it might be linked to Unit directly? 
    # Let's assume for now maintenance payments are linked via unit_id directly or tenancy.
    # Updated: finance.py showed `unit_id` column.
    expense_query = (
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.unit_id.in_(unit_ids),
                Payment.payment_type != "RENT", # Assuming everything else is expense/mixed
                Payment.payment_date >= six_months_ago
            )
        )
    )
    expense_result = await db.execute(expense_query)
    maintenance_spend = expense_result.scalar() or 0.0

    financial_stats = FinancialStats(
        current_month_projected_rent=projected_rent,
        pending_rent=0.0, # Placeholder: Requires complex logic checking 'due date' vs 'paid'
        total_revenue_6_months=total_revenue_6m,
        monthly_breakdown=monthly_revenue,
        maintenance_spend_6_months=maintenance_spend
    )

    # 4. Alerts
    alerts = []
    
    # Expiring Leases (Next 90 days)
    expiry_threshold = today + timedelta(days=90)
    expiring_query = select(Tenancy).where(
        and_(
            Tenancy.unit_id.in_(unit_ids),
            Tenancy.status == "ACTIVE",
            Tenancy.end_date <= expiry_threshold,
            Tenancy.end_date >= today
        )
    )
    expiring_leases = (await db.execute(expiring_query)).scalars().all()
    
    for tenancy in expiring_leases:
        days_left = (tenancy.end_date - today).days
        # Find unit number
        unit = next((u for u in units if u.id == tenancy.unit_id), None)
        unit_num = unit.unit_number if unit else "Unknown"
        
        alerts.append(AlertItem(
            type="EXPIRING_LEASE",
            message=f"Lease ends in {days_left} days",
            severity="HIGH" if days_left < 30 else "MEDIUM",
            unit_number=unit_num,
            target_date=tenancy.end_date
        ))

    # Vacant Units
    if vacant > 0:
        alerts.append(AlertItem(
            type="VACANT_UNIT",
            message=f"{vacant} units are currently vacant",
            severity="HIGH"
        ))

    return PropertyAnalytics(
        occupancy=occupancy_stats,
        financials=financial_stats,
        alerts=alerts
    )
