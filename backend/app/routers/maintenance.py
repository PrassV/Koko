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
    if user.role != "TENANT":
        raise HTTPException(status_code=403, detail="Only Tenants can raise requests")
    
    # Verify tenant belongs to unit (optional validation but good for security)
    # For MVP, assuming tenant selects unit they are associated with
    
    new_req = MaintenanceRequest(
        unit_id=data.unit_id,
        tenant_id=user.id,
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
