from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Property, Tenancy, Payment, MaintenanceRequest

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats")
async def get_admin_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Aggregate counts
    user_count = await db.execute(select(func.count(User.id)))
    prop_count = await db.execute(select(func.count(Property.id)))
    tenancy_count = await db.execute(select(func.count(Tenancy.id)).where(Tenancy.status == 'ACTIVE'))
    
    return {
        "users": user_count.scalar(),
        "properties": prop_count.scalar(),
        "active_tenancies": tenancy_count.scalar()
    }

@router.get("/users")
async def get_all_users(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(User))
    return result.scalars().all()
