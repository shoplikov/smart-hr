from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.models.schema import Department, KpiCatalog, KpiTimeseries
from src.schemas.api import KpiDataPoint

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/kpi/{department_id}", response_model=list[KpiDataPoint])
async def get_department_kpi(
    department_id: int, kpi_id: int, db: AsyncSession = Depends(get_db)
):
    """Получение временного ряда KPI для дашборда руководителя."""
    # Check if department exists
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Отдел не найден")

    result = await db.execute(
        select(KpiTimeseries.period, KpiTimeseries.value)
        .where(
            KpiTimeseries.department_id == department_id, KpiTimeseries.kpi_id == kpi_id
        )
        .order_by(KpiTimeseries.period.asc())
    )

    rows = result.all()
    # Format dates to string for JSON serialization
    return [{"period": row.period.isoformat(), "value": row.value} for row in rows]
