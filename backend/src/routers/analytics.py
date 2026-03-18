from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.models.schema import Department, KpiCatalog, KpiTimeseries

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


class ChartDataPoint(BaseModel):
    name: str
    value: float


class DashboardResponse(BaseModel):
    kpi_name: str
    unit: str
    data: list[ChartDataPoint]


@router.get("/kpi/{department_id}", response_model=DashboardResponse)
async def get_department_kpi(
    department_id: int,
    metric_key: str = "dev_velocity",  # Defaults to a string key if not provided
    db: AsyncSession = Depends(get_db),
):
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Отдел не найден")

    # Fetch the title and unit from the catalog
    kpi = await db.get(KpiCatalog, metric_key)
    kpi_title = kpi.title if kpi else "Key Performance Indicator"
    kpi_unit = kpi.unit if kpi else "Units"

    result = await db.execute(
        select(KpiTimeseries)
        .where(
            KpiTimeseries.department_id == department_id,
            KpiTimeseries.metric_key == metric_key,
        )
        .order_by(KpiTimeseries.period_date.asc())
    )
    rows = result.scalars().all()

    # Format the data for React Recharts
    chart_data = [
        ChartDataPoint(
            name=row.period_date.strftime("%b %Y"), value=float(row.value_num)
        )
        for row in rows
    ]

    return DashboardResponse(kpi_name=kpi_title, unit=kpi_unit, data=chart_data)
