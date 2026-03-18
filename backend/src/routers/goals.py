import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.models.schema import Goal, GoalStatusEnum, QuarterEnum
from src.schemas.api import (
    GoalCreate,
    GoalEvaluateRequest,
    GoalGenerateRequest,
    GoalResponse,
    GoalStatusUpdate,
    GoalUpdate,
)
from src.services.goal_generator import goal_generator
from src.services.smart_evaluator import smart_evaluator

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


# --- AI Endpoints ---
@router.post("/ai/generate")
async def generate_goals(request: GoalGenerateRequest):
    """Generates suggested goals using the RAG Service and OpenAI."""
    result = await goal_generator.generate_goals(
        role=request.role,
        department=request.department,
        quarter=request.quarter,
        year=request.year,
    )
    return result


@router.post("/ai/evaluate")
async def evaluate_goal_endpoint(request: GoalEvaluateRequest):
    """Evaluates a goal against SMART criteria using OpenAI."""
    result = await smart_evaluator.evaluate_goal(
        title=request.title, description=request.description
    )
    return result


# --- Database Endpoints ---
@router.post("/", response_model=GoalResponse)
async def create_goal(goal: GoalCreate, db: AsyncSession = Depends(get_db)):
    q_enum = getattr(QuarterEnum, f"Q{goal.quarter}", QuarterEnum.Q1)

    new_goal = Goal(
        employee_id=goal.employee_id,
        department_id=goal.department_id,
        goal_text=goal.title,
        metric=goal.description,
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
