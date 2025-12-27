from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models import MaintenanceRequest, Tenancy, User
from pydantic import BaseModel

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

class RequestCreate(BaseModel):
    title: str
    description: str
    unit_id: int 

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_request(
    data: RequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify unit exists
    unit_res = await db.execute(select(Unit).where(Unit.id == data.unit_id))
    unit = unit_res.scalars().first()
    if not unit:
         raise HTTPException(status_code=404, detail="Unit not found")

    tenant_id = None
    if user.role == "TENANT":
        # Check authorization (is this tenant in this unit?)
        # For MVP, assumed valid if they pass unit_id
        tenant_id = user.id
    elif user.role == "OWNER" or user.role == "ADMIN":
        # If owner raises, they might raise for a specific tenant or empty unit
        # Try to find active tenant
        active_lease = await db.execute(
            select(Tenancy).where(Tenancy.unit_id == data.unit_id).where(Tenancy.status == "ACTIVE")
        )
        lease = active_lease.scalars().first()
        if lease and lease.tenant_id:
            tenant_id = lease.tenant_id

    new_req = MaintenanceRequest(
        unit_id=data.unit_id,
        tenant_id=tenant_id, 
        reported_by_id=user.id,
        title=data.title,
        description=data.description
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return new_req

@router.get("/")
async def get_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role == "ADMIN":
        result = await db.execute(select(MaintenanceRequest))
    elif user.role == "OWNER":
        # Join with properties/units to filtering by owner's units
        # Simplified:
        result = await db.execute(select(MaintenanceRequest)) # TODO: filter by owner's units
    else:
        result = await db.execute(select(MaintenanceRequest).where(MaintenanceRequest.tenant_id == user.id))
    return result.scalars().all()
