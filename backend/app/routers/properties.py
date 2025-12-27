from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.database import get_db
from app.dependencies import get_current_user, require_role
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
    highlights: List[str] = []
    house_rules: List[str] = []
    nearby_places: List[dict] = []
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
    user: User = Depends(require_role("OWNER")),
    db: AsyncSession = Depends(get_db)
):
    
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
        highlights=prop_data.highlights,
        house_rules=prop_data.house_rules,
        nearby_places=prop_data.nearby_places,
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
    from sqlalchemy import func, and_, desc, extract, case, literal_column
    from datetime import datetime, timedelta
    from app.models import Tenancy, Payment, MaintenanceRequest, Unit
    from app.schemas_analytics import PropertyAnalytics, OccupancyStats, FinancialStats, MonthlyRevenue, AlertItem

    # 1. Verify Ownership
    # Using explicit check here as it's specific to property_id logic, 
    # but could be abstracted if we load property in dependency.
    # For now, keep it efficient:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Occupancy Stats (Aggregated)
    # Count units by status
    # SELECT count(id) FILTER (WHERE status='OCCUPIED'), ...
    occupancy_query = (
        select(
            func.count(Unit.id).label("total"),
            func.sum(case((Unit.status == "OCCUPIED", 1), else_=0)).label("occupied"),
            func.sum(case((Unit.status == "VACANT", 1), else_=0)).label("vacant"),
            func.sum(case((Unit.status == "UNDER_MAINTENANCE", 1), else_=0)).label("maintenance")
        )
        .where(Unit.property_id == property_id)
    )
    occ_res = (await db.execute(occupancy_query)).first()
    
    occupancy_stats = OccupancyStats(
        total_units=occ_res.total or 0,
        occupied=occ_res.occupied or 0,
        vacant=occ_res.vacant or 0,
        under_maintenance=occ_res.maintenance or 0
    )

    # 3. Financials
    # Get Unit IDs subquery for filtering
    unit_ids_sub = select(Unit.id).where(Unit.property_id == property_id)

    # Projected Rent (Sum of rent from ACTIVE tenancies in these units)
    proj_rent_query = (
        select(func.sum(Tenancy.rent_amount))
        .where(
            and_(
                Tenancy.unit_id.in_(unit_ids_sub),
                Tenancy.status == "ACTIVE"
            )
        )
    )
    projected_rent = (await db.execute(proj_rent_query)).scalar() or 0.0

    # 6 Month Window
    today = date.today()
    six_months_ago = today - timedelta(days=180)

    # Revenue Breakdown (Group by Month)
    # We join Tenancy (to filter by unit) -> Payment
    revenue_query = (
        select(
            extract('year', Payment.payment_date).label('year'),
            extract('month', Payment.payment_date).label('month'),
            func.sum(Payment.amount).label('total')
        )
        .join(Tenancy, Payment.tenancy_id == Tenancy.id)
        .where(
            and_(
                Tenancy.unit_id.in_(unit_ids_sub),
                Payment.payment_type == "RENT",
                Payment.payment_date >= six_months_ago
            )
        )
        .group_by(
            extract('year', Payment.payment_date),
            extract('month', Payment.payment_date)
        )
        .order_by(
            extract('year', Payment.payment_date),
            extract('month', Payment.payment_date)
        )
    )
    rev_rows = (await db.execute(revenue_query)).all()
    
    # Fill missing months
    first_day_current = today.replace(day=1)
    monthly_map = {(int(r.year), int(r.month)): r.total for r in rev_rows}
    monthly_revenue = []
    total_revenue_6m = 0.0
    
    for i in range(5, -1, -1):
        # Go back i months
        # Logic: find date 30*i days ago roughly or strict month subtraction
        # Strict month subtraction:
        curr_m = first_day_current.month - i
        curr_y = first_day_current.year
        while curr_m <= 0:
            curr_m += 12
            curr_y -= 1
            
        amount = monthly_map.get((curr_y, curr_m), 0.0)
        total_revenue_6m += amount
        # Get Month Name
        m_name = date(curr_y, curr_m, 1).strftime("%b")
        monthly_revenue.append(MonthlyRevenue(
            month=m_name,
            year=curr_y,
            amount=amount
        ))

    # Maintenance Spend
    expense_query = (
        select(func.sum(Payment.amount))
        .join(Tenancy, Payment.tenancy_id == Tenancy.id)
        .where(
            and_(
                Tenancy.unit_id.in_(unit_ids_sub),
                Payment.payment_type != "RENT",
                Payment.payment_date >= six_months_ago
            )
        )
    )
    maintenance_spend = (await db.execute(expense_query)).scalar() or 0.0

    financial_stats = FinancialStats(
        current_month_projected_rent=projected_rent,
        pending_rent=0.0, # Still placeholder
        total_revenue_6_months=total_revenue_6m,
        monthly_breakdown=monthly_revenue,
        maintenance_spend_6_months=maintenance_spend
    )

    # 4. Alerts
    alerts = []
    
    # Expiring Leases (SQL Check)
    expiry_threshold = today + timedelta(days=90)
    expiring_query = (
        select(Tenancy, Unit.unit_number)
        .join(Unit, Tenancy.unit_id == Unit.id)
        .where(
            and_(
                Tenancy.unit_id.in_(unit_ids_sub),
                Tenancy.status == "ACTIVE",
                Tenancy.end_date <= expiry_threshold,
                Tenancy.end_date >= today
            )
        )
    )
    expiring_rows = (await db.execute(expiring_query)).all()
    # Row is (Tenancy, unit_number) tuple
    
    for ten, u_num in expiring_rows:
        days_left = (ten.end_date - today).days
        alerts.append(AlertItem(
            type="EXPIRING_LEASE",
            message=f"Lease ends in {days_left} days",
            severity="HIGH" if days_left < 30 else "MEDIUM",
            unit_number=u_num,
            target_date=ten.end_date
        ))

    # Vacant Units (Already have count from step 2)
    if occupancy_stats.vacant > 0:
        alerts.append(AlertItem(
            type="VACANT_UNIT",
            message=f"{occupancy_stats.vacant} units are currently vacant",
            severity="HIGH"
        ))

    return PropertyAnalytics(
        occupancy=occupancy_stats,
        financials=financial_stats,
        alerts=alerts
    )

@router.get("/units/{unit_id}")
async def get_unit_details(
    unit_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    from app.models import Tenancy
    
    # Eager load Property, Current Tenancy, and History
    query = (
        select(Unit)
        .options(
            selectinload(Unit.property),
            selectinload(Unit.tenancy).selectinload(Tenancy.tenant), # Current tenant user
            selectinload(Unit.tenancies).selectinload(Tenancy.tenant), # History
            selectinload(Unit.payments) # Ledger
        )
        .where(Unit.id == unit_id)
    )
    result = await db.execute(query)
    unit = result.scalars().first()
    
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
        
    # Verify Ownership via Property
    if unit.property.owner_id != user.id and user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return unit
