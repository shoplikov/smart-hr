import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.models.llm_schemas import GoalGenerationResult, SmartEvaluationResult
from src.models.schema import Employee, Goal
from src.schemas.api import (
    EvaluateGoalRequest,
    GenerateGoalsRequest,
    GoalCreate,
    GoalResponse,
    GoalStatusUpdate,
)
from src.services.goal_generator import goal_generator
from src.services.smart_evaluator import smart_evaluator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(goal_in: GoalCreate, db: AsyncSession = Depends(get_db)):
    """Создание новой цели сотрудника."""
    # Verify employee exists
    employee = await db.get(Employee, goal_in.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    new_goal = Goal(**goal_in.model_dump(), status="DRAFT")
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    return new_goal


@router.get("/employee/{employee_id}", response_model=list[GoalResponse])
async def get_employee_goals(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Получение списка целей конкретного сотрудника."""
    result = await db.execute(select(Goal).where(Goal.employee_id == employee_id))
    goals = result.scalars().all()
    return goals


@router.post("/ai/evaluate", response_model=SmartEvaluationResult)
async def evaluate_goal_smart(request: EvaluateGoalRequest):
    """Оценка цели по критериям SMART с помощью AI."""
    try:
        return await smart_evaluator.evaluate_goal(
            title=request.title, description=request.description
        )
    except Exception as e:
        logger.error(f"Error evaluating goal: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при оценке цели AI")


@router.post("/ai/generate", response_model=GoalGenerationResult)
async def generate_goals_smart(request: GenerateGoalsRequest):
    """Генерация стратегических целей на основе роли и отдела (RAG + AI)."""
    try:
        return await goal_generator.generate_goals(
            role=request.role,
            department=request.department,
            quarter=request.quarter,
            year=request.year,
        )
    except Exception as e:
        logger.error(f"Error generating goals: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при генерации целей AI")


@router.patch("/{goal_id}/status", response_model=GoalResponse)
async def update_goal_status(
    goal_id: int, status_update: GoalStatusUpdate, db: AsyncSession = Depends(get_db)
):
    """Обновление целей hr-ом"""
    query = (
        update(Goal)
        .where(Goal.id == goal_id)
        .values(status=status_update.status)
        .returning(Goal)
    )
    result = await db.execute(query)
    updated_goal = result.scalars().first()

    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.commit()
    return updated_goal
