import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.models.schema import Goal, GoalStatusEnum, QuarterEnum

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


# --- Pydantic Schemas ---
class GoalCreate(BaseModel):
    title: str
    description: str
    quarter: int
    year: int
    employee_id: int
    department_id: int = 1  # Default to 1 for the demo


class GoalUpdate(BaseModel):
    title: str
    description: str


class GoalStatusUpdate(BaseModel):
    status: str


class GoalResponse(BaseModel):
    id: str  # React expects a string, DB uses UUID
    title: str
    description: str
    quarter: int
    year: int
    employee_id: int
    status: str

    class Config:
        from_attributes = True


# --- Endpoints ---
@router.post("/", response_model=GoalResponse)
async def create_goal(goal: GoalCreate, db: AsyncSession = Depends(get_db)):
    q_enum = getattr(QuarterEnum, f"Q{goal.quarter}", QuarterEnum.Q1)

    new_goal = Goal(
        employee_id=goal.employee_id,
        department_id=goal.department_id,
        goal_text=goal.title,  # Translate title -> goal_text
        metric=goal.description,  # Translate description -> metric
        quarter=q_enum,
        year=goal.year,
        status=GoalStatusEnum.draft,
    )
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)

    return {
        "id": str(new_goal.goal_id),
        "title": new_goal.goal_text,
        "description": new_goal.metric or "",
        "quarter": goal.quarter,
        "year": new_goal.year,
        "employee_id": new_goal.employee_id,
        "status": new_goal.status.value.upper(),
    }


@router.get("/employee/{employee_id}", response_model=List[GoalResponse])
async def get_employee_goals(employee_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Goal).where(Goal.employee_id == employee_id)
    result = await db.execute(query)
    goals = result.scalars().all()

    response_list = []
    for g in goals:
        q_int = int(g.quarter.value[-1]) if g.quarter else 1
        response_list.append(
            {
                "id": str(g.goal_id),
                "title": g.goal_text,
                "description": g.metric or "",
                "quarter": q_int,
                "year": g.year,
                "employee_id": g.employee_id,
                "status": g.status.value.upper(),
            }
        )
    return response_list


@router.patch("/{goal_id}/status", response_model=GoalResponse)
async def update_goal_status(
    goal_id: uuid.UUID,
    status_update: GoalStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    db_status = status_update.status.lower()
    query = select(Goal).where(Goal.goal_id == goal_id)
    result = await db.execute(query)
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal.status = db_status
    await db.commit()
    await db.refresh(goal)

    q_int = int(goal.quarter.value[-1]) if goal.quarter else 1
    return {
        "id": str(goal.goal_id),
        "title": goal.goal_text,
        "description": goal.metric or "",
        "quarter": q_int,
        "year": goal.year,
        "employee_id": goal.employee_id,
        "status": goal.status.value.upper(),
    }


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID, goal_update: GoalUpdate, db: AsyncSession = Depends(get_db)
):
    query = select(Goal).where(Goal.goal_id == goal_id)
    result = await db.execute(query)
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status != GoalStatusEnum.draft:
        raise HTTPException(status_code=400, detail="Cannot edit an approved goal.")

    goal.goal_text = goal_update.title
    goal.metric = goal_update.description
    await db.commit()
    await db.refresh(goal)

    q_int = int(goal.quarter.value[-1]) if goal.quarter else 1
    return {
        "id": str(goal.goal_id),
        "title": goal.goal_text,
        "description": goal.metric or "",
        "quarter": q_int,
        "year": goal.year,
        "employee_id": goal.employee_id,
        "status": goal.status.value.upper(),
    }


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = select(Goal).where(Goal.goal_id == goal_id)
    result = await db.execute(query)
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status != GoalStatusEnum.draft:
        raise HTTPException(status_code=400, detail="Cannot delete an approved goal.")

    await db.delete(goal)
    await db.commit()
    return None
