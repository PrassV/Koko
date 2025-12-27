from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_user
from app.models import MaintenanceRequest, MaintenanceComment, Tenancy, User, Unit, Property
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

class RequestCreate(BaseModel):
    title: str
    description: str
    unit_id: int 

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    user_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

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
        stmt = select(MaintenanceRequest).options(selectinload(MaintenanceRequest.unit))
    elif user.role == "OWNER":
        # Filter by owner's units
        stmt = (
            select(MaintenanceRequest)
            .join(MaintenanceRequest.unit)
            .join(Unit.property)
            .where(Property.owner_id == user.id)
            .options(selectinload(MaintenanceRequest.unit))
        )
    else:
        stmt = select(MaintenanceRequest).where(MaintenanceRequest.tenant_id == user.id).options(selectinload(MaintenanceRequest.unit))
    
    result = await db.execute(stmt.order_by(MaintenanceRequest.created_at.desc()))
    return result.scalars().all()

@router.get("/{request_id}/comments")
async def get_comments(
    request_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify access
    req_res = await db.execute(select(MaintenanceRequest).where(MaintenanceRequest.id == request_id))
    req = req_res.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # TODO: Strict Auth check (only owner of property or tenant of request can view)
    
    stmt = (
        select(MaintenanceComment)
        .where(MaintenanceComment.request_id == request_id)
        .options(selectinload(MaintenanceComment.user))
        .order_by(MaintenanceComment.created_at.asc())
    )
    result = await db.execute(stmt)
    comments = result.scalars().all()
    
    return [
        {
            "id": c.id,
            "content": c.content,
            "user_id": c.user_id,
            "user_name": c.user.name or "User",
            "created_at": c.created_at
        }
        for c in comments
    ]

@router.post("/{request_id}/comments")
async def add_comment(
    request_id: int,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    req_res = await db.execute(select(MaintenanceRequest).where(MaintenanceRequest.id == request_id))
    req = req_res.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    new_comment = MaintenanceComment(
        request_id=request_id,
        user_id=user.id,
        content=data.content
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    return new_comment
