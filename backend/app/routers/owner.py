from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.dependencies import require_role
from app.models import User, Property, Tenancy, Payment, Unit
from datetime import date, timedelta

router = APIRouter(prefix="/owner", tags=["Owner"])

@router.get("/stats")
async def get_owner_stats(
    user: User = Depends(require_role("OWNER")),
    db: AsyncSession = Depends(get_db)
):
    # 1. Total Properties
    prop_count_res = await db.execute(
        select(func.count(Property.id)).where(Property.owner_id == user.id)
    )
    total_properties = prop_count_res.scalar() or 0

    # 2. Active Tenants (Tenancies in ACTIVE status linked to user's units)
    # Join Tenancy -> Unit -> Property
    active_tenants_res = await db.execute(
        select(func.count(Tenancy.id))
        .join(Unit, Tenancy.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(
            and_(
                Property.owner_id == user.id,
                Tenancy.status == "ACTIVE"
            )
        )
    )
    active_tenants = active_tenants_res.scalar() or 0

    # 3. Monthly Revenue (Last 30 days)
    # Join Payment -> Tenancy -> Unit -> Property 
    # OR Payment -> Unit -> Property (if payment linked to unit directly)
    # Safest based on current schema usage (Payment -> Tenancy)
    
    thirty_days_ago = date.today() - timedelta(days=30)
    
    # We need to sum payments where the unit belongs to the owner
    revenue_res = await db.execute(
        select(func.sum(Payment.amount))
        .join(Tenancy, Payment.tenancy_id == Tenancy.id)
        .join(Unit, Tenancy.unit_id == Unit.id)
        .join(Property, Unit.property_id == Property.id)
        .where(
            and_(
                Property.owner_id == user.id,
                Payment.payment_type == "RENT",
                Payment.payment_date >= thirty_days_ago
            )
        )
    )
    monthly_revenue = revenue_res.scalar() or 0.0

    # Occupancy Rate (Active Tenants / Total Units)
    # Get total units count first
    units_count_res = await db.execute(
        select(func.count(Unit.id))
        .join(Property, Unit.property_id == Property.id)
        .where(Property.owner_id == user.id)
    )
    total_units = units_count_res.scalar() or 0
    
    occupancy_rate = 0
    if total_units > 0:
        # Count occupied units specifically (Unit.status == OCCUPIED)
        # This might differ from active tenancies count if data drift, but let's trust Unit status for simple occupancy rate
        occupied_units_res = await db.execute(
             select(func.count(Unit.id))
            .join(Property, Unit.property_id == Property.id)
            .where(
                and_(
                    Property.owner_id == user.id,
                    Unit.status == "OCCUPIED"
                )
            )
        )
        occupied_units = occupied_units_res.scalar() or 0
        occupancy_rate = int((occupied_units / total_units) * 100)

    return {
        "total_properties": total_properties,
        "active_tenants": active_tenants,
        "monthly_revenue": monthly_revenue,
        "occupancy_rate": occupancy_rate
    }
