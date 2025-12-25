from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Property, Unit, User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/properties", tags=["Properties"])

class PropertyCreate(BaseModel):
    name: str
    address: str
    description: Optional[str] = None

class UnitCreate(BaseModel):
    unit_number: str
    specifications: Optional[dict] = None # JSON

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
        description=prop_data.description
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
        specifications=unit_data.specifications
    )
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)
    return new_unit
