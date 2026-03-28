from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.models.schema import Department, Employee, Position

router = APIRouter(prefix="/api/v1", tags=["Employees & Departments"])


@router.get("/employees")
async def list_employees(
    manager_id: Optional[int] = None,
    is_manager: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(
            Employee.id,
            Employee.full_name,
            Employee.email,
            Employee.department_id,
            Department.name.label("department_name"),
            Department.code.label("department_code"),
            Position.name.label("position_name"),
            Employee.manager_id,
        )
        .join(Department, Employee.department_id == Department.id)
        .join(Position, Employee.position_id == Position.id)
        .where(Employee.is_active.is_(True))
    )

    if manager_id is not None:
        query = query.where(Employee.manager_id == manager_id)

    if is_manager is True:
        query = query.where(Employee.id.in_(select(Employee.manager_id).where(Employee.manager_id.isnot(None))))
    elif is_manager is False:
        query = query.where(Employee.id.notin_(select(Employee.manager_id).where(Employee.manager_id.isnot(None))))

    query = query.order_by(Department.name, Employee.full_name)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": r.id,
            "full_name": r.full_name,
            "email": r.email,
            "department_id": r.department_id,
            "department_name": r.department_name,
            "department_code": r.department_code,
            "position_name": r.position_name,
            "manager_id": r.manager_id,
        }
        for r in rows
    ]


@router.get("/departments")
async def list_departments(db: AsyncSession = Depends(get_db)):
    query = (
        select(Department)
        .where(Department.is_active.is_(True))
        .order_by(Department.name)
    )
    result = await db.execute(query)
    departments = result.scalars().all()

    return [
        {
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "parent_id": d.parent_id,
        }
        for d in departments
    ]
