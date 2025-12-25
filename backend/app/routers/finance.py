from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Payment, PaymentType, User, Tenancy, Unit, Property
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/finance", tags=["Finance"])

class PaymentCreate(BaseModel):
    tenancy_id: int
    amount: float
    payment_type: PaymentType
    payment_date: date

@router.post("/payments", status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "OWNER" and user.role != "ADMIN":
        # Maybe tenants can pay? But usually this records a payment made.
        # If integration with Stripe, this would be a webhook or flow.
        # For now, manual recording by owner or system.
        raise HTTPException(status_code=403, detail="Not authorized to record payments manually")
        
    tenancy_res = await db.execute(select(Tenancy).where(Tenancy.id == data.tenancy_id))
    tenancy = tenancy_res.scalars().first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")
        
    new_payment = Payment(
        tenancy_id=data.tenancy_id,
        amount=data.amount,
        payment_type=data.payment_type.value,
        payment_date=data.payment_date,
        status="PAID"
    )
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    return new_payment

@router.get("/payments")
async def get_payments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role == "ADMIN":
        result = await db.execute(select(Payment))
    elif user.role == "OWNER":
        # Get payments linked to tenancies of units owned by this owner
        stmt = select(Payment).join(Tenancy).join(Unit).join(Property).where(Property.owner_id == user.id)
        result = await db.execute(stmt)
    else:
        # Tenant view
        result = await db.execute(
            select(Payment).join(Tenancy).where(Tenancy.tenant_id == user.id)
        )
    return result.scalars().all()
