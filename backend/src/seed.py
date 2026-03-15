import asyncio
import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import AsyncSessionLocal
from src.models.schema import (
    Department,
    Employee,
    Goal,
    KpiCatalog,
    KpiTimeseries,
    Position,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_data(db: AsyncSession):
    # Check if data already exists to prevent duplicate seeding
    result = await db.execute(select(Department).limit(1))
    if result.scalars().first():
        logger.info("Database already seeded. Skipping.")
        return

    logger.info("Seeding database with mock HR data...")

    # 1. Create Department
    it_dept = Department(name="IT Department", code="IT-001")
    db.add(it_dept)
    await db.commit()
    await db.refresh(it_dept)

    # 2. Create Positions
    manager_pos = Position(name="Engineering Manager", grade="L5")
    dev_pos = Position(name="Frontend Developer", grade="L3")
    db.add_all([manager_pos, dev_pos])
    await db.commit()
    await db.refresh(manager_pos)
    await db.refresh(dev_pos)

    # 3. Create Employees
    manager = Employee(
        employee_code="EMP-100",
        full_name="Иван Иванов",
        email="ivan.manager@company.com",
        department_id=it_dept.id,
        position_id=manager_pos.id,
    )
    db.add(manager)
    await db.commit()
    await db.refresh(manager)

    developer = Employee(
        employee_code="EMP-101",
        full_name="Алексей Смирнов",
        email="alexey.dev@company.com",
        department_id=it_dept.id,
        position_id=dev_pos.id,
        manager_id=manager.id,
    )
    db.add(developer)
    await db.commit()
    await db.refresh(developer)

    # 4. Create Goals
    goal1 = Goal(
        employee_id=developer.id,
        title="Миграция на React 18",
        description="Обновить весь фронтенд до React 18 и исправить deprecated методы к концу квартала.",
        status="APPROVED",
        quarter=3,
        year=2026,
    )
    goal2 = Goal(
        employee_id=developer.id,
        title="Повысить покрытие тестами",
        description="Написать unit-тесты для ключевых компонентов. Текущее покрытие 40%, цель - 80%.",
        status="DRAFT",
        quarter=3,
        year=2026,
    )
    db.add_all([goal1, goal2])

    # 5. Create KPI & Timeseries for Dashboard
    kpi = KpiCatalog(
        name="Velocity (Story Points)",
        unit="SP",
        description="Скорость закрытия задач командой",
    )
    db.add(kpi)
    await db.commit()
    await db.refresh(kpi)

    timeseries_data = [
        KpiTimeseries(
            kpi_id=kpi.id, department_id=it_dept.id, period=date(2026, 1, 1), value=45.0
        ),
        KpiTimeseries(
            kpi_id=kpi.id, department_id=it_dept.id, period=date(2026, 2, 1), value=52.0
        ),
        KpiTimeseries(
            kpi_id=kpi.id, department_id=it_dept.id, period=date(2026, 3, 1), value=60.0
        ),
        KpiTimeseries(
            kpi_id=kpi.id, department_id=it_dept.id, period=date(2026, 4, 1), value=58.0
        ),
        KpiTimeseries(
            kpi_id=kpi.id, department_id=it_dept.id, period=date(2026, 5, 1), value=75.0
        ),
    ]
    db.add_all(timeseries_data)
    await db.commit()

    logger.info("Database successfully seeded!")


async def main():
    async with AsyncSessionLocal() as session:
        await seed_data(session)


if __name__ == "__main__":
    asyncio.run(main())
