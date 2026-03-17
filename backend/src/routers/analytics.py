from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.models.schema import Department, KpiCatalog, KpiTimeseries
from src.schemas.api import ChartDataPoint, DashboardResponse

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/kpi/{department_id}", response_model=DashboardResponse)
async def get_department_kpi(
    department_id: int, kpi_id: int, db: AsyncSession = Depends(get_db)
):
    """Получение временного ряда KPI и метаданных для дашборда руководителя."""

    # 1. Проверяем существование отдела
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Отдел не найден")

    # 2. Получаем метаданные KPI (название, единицы измерения)
    kpi = await db.get(KpiCatalog, kpi_id)
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI не найден")

    # 3. Получаем сами данные, отсортированные по дате
    result = await db.execute(
        select(KpiTimeseries)
        .where(
            KpiTimeseries.department_id == department_id, KpiTimeseries.kpi_id == kpi_id
        )
        .order_by(KpiTimeseries.period.asc())
    )
    rows = result.scalars().all()

    # 4. Форматируем даты для красивого отображения в Recharts (например, "Jan 2026")
    chart_data = [
        ChartDataPoint(name=row.period.strftime("%b %Y"), value=float(row.value))
        for row in rows
    ]

    # Возвращаем комбинированный ответ
    return DashboardResponse(kpi_name=kpi.name, unit=kpi.unit, data=chart_data)
