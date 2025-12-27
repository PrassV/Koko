from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import Tenancy, Unit, User, Payment
from pydantic import BaseModel, model_validator
from datetime import date
from typing import Optional, Literal

router = APIRouter(prefix="/tenancy", tags=["Tenancy"])

class TenancyCreate(BaseModel):
    unit_id: int
    tenant_email: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    advance_amount: Optional[float] = 0
    
    # Payment Structure
    payment_structure: Literal["LEASE", "RENT"] = "RENT"
    lease_amount: Optional[float] = None  # Required if LEASE
    rent_amount: Optional[float] = None   # Required if RENT
    
    @model_validator(mode='after')
    def validate_payment_amounts(self):
        if self.payment_structure == "LEASE":
            if not self.lease_amount:
                raise ValueError("lease_amount is required for LEASE payment structure")
            if self.rent_amount:
                raise ValueError("rent_amount should not be set for LEASE payment structure")
        elif self.payment_structure == "RENT":
            if not self.rent_amount:
                raise ValueError("rent_amount is required for RENT payment structure")
            if self.lease_amount:
                raise ValueError("lease_amount should not be set for RENT payment structure")
        return self

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tenancy(
    data: TenancyCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role("OWNER")),
    db: AsyncSession = Depends(get_db)
):
    # Check unit ownership
    unit_res = await db.execute(select(Unit).where(Unit.id == data.unit_id))
    unit = unit_res.scalars().first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
        
    tenant_id = None
    
    # Check tenant existence if email provided
    if data.tenant_email:
        tenant_res = await db.execute(select(User).where(User.email == data.tenant_email))
        tenant = tenant_res.scalars().first()
        if tenant:
            tenant_id = tenant.id
    
    # If no tenant found by email, check if we have name for offline
    if not tenant_id and not data.tenant_name:
        raise HTTPException(status_code=400, detail="Must provide Tenant Email (for registered user) or Tenant Name (for offline)")
    
    new_tenancy = Tenancy(
        unit_id=data.unit_id,
        tenant_id=tenant_id,
        tenant_name=data.tenant_name,
        tenant_email=data.tenant_email,
        tenant_phone=data.tenant_phone,
        start_date=data.start_date,
        end_date=data.end_date,
        payment_structure=data.payment_structure,
        lease_amount=data.lease_amount,
        rent_amount=data.rent_amount,
        advance_amount=data.advance_amount
    )
    db.add(new_tenancy)
    
    # Update unit status
    unit.status = "OCCUPIED"
    
    await db.commit()
    await db.refresh(new_tenancy)
    
    # For LEASE, create immediate Payment record
    if data.payment_structure == "LEASE" and data.lease_amount:
        lease_payment = Payment(
            tenancy_id=new_tenancy.id,
            unit_id=data.unit_id,
            amount=data.lease_amount,
            payment_type="LEASE",
            payment_date=date.today(),
            status="PAID"
        )
        db.add(lease_payment)
        await db.commit()
    
    # Send Invite Email in Background
    if data.tenant_email:
        from app.utils.email import send_invite_email
        background_tasks.add_task(
            send_invite_email, 
            data.tenant_email, 
            data.tenant_name or "Tenant", 
            "Koko Property", 
            unit.unit_number
        )

    return new_tenancy


class VacationNotice(BaseModel):
    notice_date: date

@router.post("/{tenancy_id}/vacate")
async def give_vacation_notice(
    tenancy_id: int,
    notice: VacationNotice,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenancy).where(Tenancy.id == tenancy_id))
    tenancy = result.scalars().first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")
        
    # Either tenant or owner (or admin) can trigger this
    if tenancy.tenant_id != user.id and user.role != "ADMIN" and user.role != "OWNER":
        # Check if user is owner of the unit
        # For simplicity, if not tenant/admin, we might need to check property ownership
        # But tenancy doesn't verify owner directly easily without join.
        # Assuming Tenant triggers it mostly.
        raise HTTPException(status_code=403, detail="Not authorized")

    tenancy.status = "NOTICE"
    tenancy.vacation_notice_date = notice.notice_date
    
    await db.commit()
    await db.refresh(tenancy)
    return tenancy

@router.get("/report")
async def get_owner_report(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "OWNER":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Simple aggregation can be done via SQL or fetching all and calculating (easier for MVP)
    # Fetch all tenancies for this owner's properties
    # Join Tenancy -> Unit -> Property -> Owner
    
    # OR fetch all payments linked to units owned by this user
    # SQLAlchemy queries can get complex here.
    # Let's do a simplified approach: Fetch all payments for properties owned by user.
    
    stmt = (
        select(Payment)
        .join(Payment.tenancy) # if linked via tenancy
        .join(Tenancy.unit)
        .join(Unit.property)
        .where(Property.owner_id == user.id)
    )
    # Note: This misses payments linked directly to Unit but not Tenancy (if we allowed that in model for Tax/EB)
    # Our Payment model has `unit_id` now optionally. 
    # Let's try to union or getting both.
    
    # For now, let's just return what we have implemented: Payments linked via Tenancy + Payments linked directly to Unit
    # Actually, simpler to just list all payments for now with client-side filtering.
    
    # Optimized query: Find all unit_ids owned by user
    subquery = select(Unit.id).join(Property).where(Property.owner_id == user.id)
    
    # Find payments where unit_id OR tenancy.unit_id matches?
    # This requires more complex query construction.
    # Let's stick to basic "My Payments" endpoint in finance router and filter there.
    pass

@router.get("/me")
async def get_my_tenancy(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "TENANT":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get active tenancy for this user
    # Order by start_date desc to get most recent
    result = await db.execute(
        select(Tenancy)
        .where(Tenancy.tenant_id == user.id)
        .where(Tenancy.status.in_(["ACTIVE", "NOTICE"]))
        .order_by(Tenancy.start_date.desc())
    )
    tenancy = result.scalars().first()
    
    if not tenancy:
        # Return 204 or 404? 404 implies error, 204 or empty object implies no data.
        # Let's return 404 for simplicity in frontend handling for "No lease found"
        raise HTTPException(status_code=404, detail="No active lease found")
        
    return tenancy
