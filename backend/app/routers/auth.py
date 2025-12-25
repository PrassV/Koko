from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user_uid, get_current_user
from app.models import User, UserRole
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Auth"])

class UserRegister(BaseModel):
    email: EmailStr
    role: UserRole
    name: str | None = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegister,
    uid: str = Depends(get_current_user_uid),
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered"
        )
    
    # Create new user
    new_user = User(
        firebase_uid=uid,
        email=user_data.email,
        role=user_data.role.value,
        name=user_data.name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/me")
async def get_me(
    uid: str = Depends(get_current_user_uid),
    db: AsyncSession = Depends(get_db)
):
    # Logic similar to get_current_user dependency but returning the model
    # Doing it explicit here to show the flow
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found in database. Please register.")
    return user

class UserUpdate(BaseModel):
    name: str | None = None
    documents: list[dict] | None = None # e.g. [{"type": "ID", "url": "..."}]

@router.patch("/me")
async def update_me(
    user_data: UserUpdate,
    user: User = Depends(get_current_user), # Use the dependency that returns the User object
    db: AsyncSession = Depends(get_db)
):
    if user_data.name:
        user.name = user_data.name
    if user_data.documents is not None:
        user.documents = user_data.documents
    
    await db.commit()
    await db.refresh(user)
    return user

