import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from src.core.database import get_db
from src.models.schema import Department, KpiCatalog, KpiTimeseries
from src.schemas.api import ChartDataPoint, DashboardResponse

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/kpi-catalog")
async def get_kpi_catalog(db: AsyncSession = Depends(get_db)):
    logger.debug("Fetching active KPI catalog")
    result = await db.execute(
        select(KpiCatalog).where(KpiCatalog.is_active == True).order_by(KpiCatalog.title)
    )
    items = result.scalars().all()
    logger.info("KPI catalog returned %d active metrics", len(items))
    return [
        {
            "metric_key": item.metric_key,
            "title": item.title,
            "unit": item.unit,
            "description": item.description,
        }
        for item in items
    ]


@router.get("/kpi/{department_id}", response_model=DashboardResponse)
async def get_department_kpi(
    department_id: int,
    metric_key: str = "dev_velocity",
    db: AsyncSession = Depends(get_db),
):
    logger.info("KPI timeseries requested: department_id=%s metric_key=%s", department_id, metric_key)
    dept = await db.get(Department, department_id)
    if not dept:
        logger.warning("Department not found: department_id=%s", department_id)
        raise HTTPException(status_code=404, detail="Отдел не найден")

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
    logger.info(
        "KPI timeseries returned %d data points for department_id=%s metric=%s",
        len(rows), department_id, metric_key,
    )

    chart_data = [
        ChartDataPoint(
            name=row.period_date.strftime("%b %Y"), value=float(row.value_num)
        )
        for row in rows
    ]

    return DashboardResponse(kpi_name=kpi_title, unit=kpi_unit, data=chart_data)
