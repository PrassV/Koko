from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date

class OccupancyStats(BaseModel):
    total_units: int
    occupied: int
    vacant: int
    under_maintenance: int

class MonthlyRevenue(BaseModel):
    month: str
    year: int
    amount: float

class FinancialStats(BaseModel):
    current_month_projected_rent: float
    pending_rent: float
    total_revenue_6_months: float
    monthly_breakdown: List[MonthlyRevenue]
    maintenance_spend_6_months: float

class AlertItem(BaseModel):
    type: str # 'EXPIRING_LEASE', 'VACANT_UNIT', 'MAINTENANCE_DUE'
    message: str
    severity: str # 'HIGH', 'MEDIUM', 'LOW'
    unit_number: Optional[str] = None
    target_date: Optional[date] = None

class PropertyAnalytics(BaseModel):
    occupancy: OccupancyStats
    financials: FinancialStats
    alerts: List[AlertItem]
