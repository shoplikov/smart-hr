import asyncio
import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.models.schema import (
    Goal,
    GoalEvaluation,
    GoalEvent,
    GoalEventTypeEnum,
    GoalReview,
    GoalStatusEnum,
    Project,
    EmployeeProject,
    Department,
    QuarterEnum,
    ReviewVerdictEnum,
)
from src.schemas.api import (
    GoalCreate,
    GoalEvaluateRequest,
    GoalGenerateRequest,
    GoalResponse,
    GoalReviewCreate,
    GoalStatusUpdate,
    GoalUpdate,
)
from src.services.goal_generator import goal_generator
from src.services.smart_evaluator import smart_evaluator

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])

LOCKED_STATUSES = {GoalStatusEnum.approved, GoalStatusEnum.done, GoalStatusEnum.archived}

VERDICT_TO_STATUS = {
    ReviewVerdictEnum.approve: GoalStatusEnum.approved,
    ReviewVerdictEnum.reject: GoalStatusEnum.rejected,
    ReviewVerdictEnum.needs_changes: GoalStatusEnum.needs_changes,
}


def _goal_to_dict(g: Goal) -> dict:
    q_int = int(g.quarter.value[-1]) if g.quarter else 1
    return {
        "id": str(g.goal_id),
        "goal_text": g.goal_text,
        "metric": g.metric,
        "quarter": q_int,
        "year": g.year,
        "employee_id": g.employee_id,
        "status": g.status.value.upper(),
    }


async def _create_event(
    db: AsyncSession,
    goal_id: uuid.UUID,
    event_type: GoalEventTypeEnum,
    actor_id: Optional[int] = None,
    old_status: Optional[GoalStatusEnum] = None,
    new_status: Optional[GoalStatusEnum] = None,
    old_text: Optional[str] = None,
    new_text: Optional[str] = None,
) -> None:
    event = GoalEvent(
        goal_id=goal_id,
        event_type=event_type,
        actor_id=actor_id,
        old_status=old_status,
        new_status=new_status,
        old_text=old_text,
        new_text=new_text,
    )
    db.add(event)


async def _get_goal_context(
    db: AsyncSession,
    goal_id: Optional[uuid.UUID] = None,
    employee_id: Optional[int] = None,
    goal_obj: Optional[Goal] = None,
) -> str:
    # 1. Start with goal object if provided, else fetch it
    if not goal_obj and goal_id:
        goal_obj = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()

    # 2. Extract context from the linked project if any
    if goal_obj:
        if goal_obj.project_id:
            project = await db.get(Project, goal_obj.project_id)
            if project:
                return f"Проект: {project.name}. Описание: {project.description or 'Нет описания'}"
        # If no project linked directly, fall back to employee context
        employee_id = goal_obj.employee_id

    # 3. If we have an employee_id, look up all their assigned projects
    if employee_id:
        query = (
            select(Project)
            .join(EmployeeProject, Project.id == EmployeeProject.project_id)
            .where(EmployeeProject.employee_id == employee_id)
        )
        result = await db.execute(query)
        projects = result.scalars().all()
        if projects:
            proj_list = "\n".join([f"- {p.name}: {p.description or 'Без описания'}" for p in projects])
            ctx = f"Проекты сотрудника (Employee ID: {employee_id}):\n{proj_list}"
            logger.info(f"Retrieved employee projects context: {ctx[:200]}...")
            return ctx

        # 4. Fallback to department if projects are still not found
        if goal_obj and goal_obj.department_id:
            dept = await db.get(Department, goal_obj.department_id)
            if dept:
                return f"Отдел: {dept.name}"

    return "Общий корпоративный контекст"


# --- AI Endpoints ---
@router.post("/ai/generate")
async def generate_goals(request: GoalGenerateRequest):
    result = await goal_generator.generate_goals(
        role=request.role,
        department=request.department,
        quarter=request.quarter,
        year=request.year,
    )
    return result


@router.post("/ai/evaluate")
async def evaluate_goal_endpoint(
    request: GoalEvaluateRequest,
    db: AsyncSession = Depends(get_db)
):
    # Determine context: explicit, or dynamic from employee
    context = request.context
    if not context and request.employee_id:
        context = await _get_goal_context(db, employee_id=request.employee_id)
    
    logger.info(f"Final evaluation context for goal evaluation endpoint: {context or 'default'}")
    
    result = await smart_evaluator.evaluate_goal(
        goal_text=request.goal_text,
        context=context or "Общий корпоративный контекст"
    )
    return result


@router.get("/ai/evaluate-batch/{employee_id}")
async def batch_evaluate_goals(
    employee_id: int, db: AsyncSession = Depends(get_db)
):
    query = select(Goal).where(Goal.employee_id == employee_id)
    result = await db.execute(query)
    goals = result.scalars().all()

    if not goals:
        raise HTTPException(status_code=404, detail="No goals found for this employee")

    # Fetch project/department info for context
    eval_tasks = []
    for g in goals:
        context = await _get_goal_context(db, goal_obj=g)
        eval_tasks.append(smart_evaluator.evaluate_goal(goal_text=g.goal_text, context=context))
    
    evaluations = await asyncio.gather(*eval_tasks)

    individual = []
    total_index = 0.0
    criteria_sums = {"S": 0.0, "M": 0.0, "A": 0.0, "R": 0.0, "T": 0.0}

    for g, ev in zip(goals, evaluations):
        ev_dict = ev.model_dump()
        ev_dict["goal_id"] = str(g.goal_id)
        ev_dict["goal_text"] = g.goal_text
        individual.append(ev_dict)
        total_index += ev.smart_index
        criteria_sums["S"] += ev.smart_scores.specific
        criteria_sums["M"] += ev.smart_scores.measurable
        criteria_sums["A"] += ev.smart_scores.achievable
        criteria_sums["R"] += ev.smart_scores.relevant
        criteria_sums["T"] += ev.smart_scores.time_bound

    n = len(goals)
    avg_index = round(total_index / n, 2) if n else 0.0
    criteria_avg = {k: round(v / n, 2) for k, v in criteria_sums.items()} if n else {}
    weakest = sorted(criteria_avg.items(), key=lambda x: x[1])

    return {
        "employee_id": employee_id,
        "total_goals": n,
        "average_smart_index": avg_index,
        "criteria_averages": criteria_avg,
        "weakest_criteria": [
            {"criterion": k, "avg_score": v} for k, v in weakest if v < 0.7
        ],
        "evaluations": individual,
    }


# --- Evaluation Persistence Endpoints ---
@router.post("/{goal_id}/evaluations")
async def create_evaluation(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    goal = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Fetch context (Project description or Department)
    context = await _get_goal_context(db, goal_obj=goal)
    result = await smart_evaluator.evaluate_goal(goal_text=goal.goal_text, context=context)
    scores_dict = result.smart_scores.model_dump() if result.smart_scores else {}

    evaluation = GoalEvaluation(
        goal_id=goal_id,
        smart_index=result.smart_index,
        smart_scores=scores_dict,
        recommendations=result.recommendations,
        improved_goal=result.improved_goal,
    )
    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)

    return {
        "id": str(evaluation.id),
        "goal_id": str(goal_id),
        "smart_index": float(evaluation.smart_index) if evaluation.smart_index else 0,
        "smart_scores": evaluation.smart_scores,
        "recommendations": evaluation.recommendations,
        "improved_goal": evaluation.improved_goal,
        "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None,
    }


@router.get("/{goal_id}/evaluations/latest")
async def get_latest_evaluation(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(GoalEvaluation)
        .where(GoalEvaluation.goal_id == goal_id)
        .order_by(GoalEvaluation.created_at.desc())
        .limit(1)
    )
    result = await db.execute(query)
    evaluation = result.scalars().first()

    if not evaluation:
        raise HTTPException(status_code=404, detail="No evaluation found")

    return {
        "id": str(evaluation.id),
        "goal_id": str(goal_id),
        "smart_index": float(evaluation.smart_index) if evaluation.smart_index else 0,
        "smart_scores": evaluation.smart_scores,
        "recommendations": evaluation.recommendations,
        "improved_goal": evaluation.improved_goal,
        "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None,
    }


# --- Review Endpoints ---
@router.post("/{goal_id}/reviews")
async def create_review(
    goal_id: uuid.UUID,
    review: GoalReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    goal = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    verdict_enum = ReviewVerdictEnum(review.verdict)
    new_review = GoalReview(
        goal_id=goal_id,
        reviewer_id=review.reviewer_id,
        verdict=verdict_enum,
        comment_text=review.comment_text,
    )
    db.add(new_review)

    old_status = goal.status
    new_status = VERDICT_TO_STATUS.get(verdict_enum)
    if new_status and goal.status != new_status:
        goal.status = new_status

    event_type = {
        ReviewVerdictEnum.approve: GoalEventTypeEnum.approved,
        ReviewVerdictEnum.reject: GoalEventTypeEnum.rejected,
        ReviewVerdictEnum.needs_changes: GoalEventTypeEnum.commented,
        ReviewVerdictEnum.comment_only: GoalEventTypeEnum.commented,
    }[verdict_enum]

    await _create_event(
        db, goal_id, event_type,
        actor_id=review.reviewer_id,
        old_status=old_status,
        new_status=goal.status,
    )

    await db.commit()
    await db.refresh(goal)

    return {
        "review_id": str(new_review.id),
        "verdict": verdict_enum.value,
        "comment_text": review.comment_text,
        "goal_status": goal.status.value.upper(),
    }


@router.get("/{goal_id}/reviews")
async def get_reviews(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(GoalReview)
        .where(GoalReview.goal_id == goal_id)
        .order_by(GoalReview.created_at.desc())
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "reviewer_id": r.reviewer_id,
            "verdict": r.verdict.value,
            "comment_text": r.comment_text,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


@router.get("/{goal_id}/events")
async def get_events(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(GoalEvent)
        .where(GoalEvent.goal_id == goal_id)
        .order_by(GoalEvent.created_at.desc())
    )
    result = await db.execute(query)
    events = result.scalars().all()

    return [
        {
            "id": str(e.id),
            "event_type": e.event_type.value,
            "actor_id": e.actor_id,
            "old_status": e.old_status.value if e.old_status else None,
            "new_status": e.new_status.value if e.new_status else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


# --- CRUD Endpoints ---
@router.post("/", response_model=GoalResponse)
async def create_goal(goal: GoalCreate, db: AsyncSession = Depends(get_db)):
    q_enum = getattr(QuarterEnum, f"Q{goal.quarter}", QuarterEnum.Q1)

    new_goal = Goal(
        employee_id=goal.employee_id,
        department_id=goal.department_id,
        goal_text=goal.goal_text,
        metric=goal.metric,
        quarter=q_enum,
        year=goal.year,
        status=GoalStatusEnum.draft,
    )
    db.add(new_goal)
    await db.flush()

    await _create_event(
        db, new_goal.goal_id, GoalEventTypeEnum.created,
        actor_id=goal.employee_id,
        new_status=GoalStatusEnum.draft,
        new_text=goal.goal_text,
    )

    await db.commit()
    await db.refresh(new_goal)
    return _goal_to_dict(new_goal)


@router.get("/employee/{employee_id}", response_model=List[GoalResponse])
async def get_employee_goals(employee_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Goal).where(Goal.employee_id == employee_id)
    result = await db.execute(query)
    goals = result.scalars().all()
    return [_goal_to_dict(g) for g in goals]


@router.patch("/{goal_id}/status", response_model=GoalResponse)
async def update_goal_status(
    goal_id: uuid.UUID,
    status_update: GoalStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    db_status = status_update.status.lower()
    goal = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    old_status = goal.status
    goal.status = db_status

    await _create_event(
        db, goal_id, GoalEventTypeEnum.status_changed,
        old_status=old_status,
        new_status=GoalStatusEnum(db_status),
    )

    await db.commit()
    await db.refresh(goal)
    return _goal_to_dict(goal)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID, goal_update: GoalUpdate, db: AsyncSession = Depends(get_db)
):
    goal = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status in LOCKED_STATUSES:
        raise HTTPException(status_code=400, detail="Cannot edit a goal with this status.")

    old_text = goal.goal_text
    goal.goal_text = goal_update.goal_text
    goal.metric = goal_update.metric

    await _create_event(
        db, goal_id, GoalEventTypeEnum.edited,
        actor_id=goal.employee_id,
        old_text=old_text,
        new_text=goal_update.goal_text,
    )

    await db.commit()
    await db.refresh(goal)
    return _goal_to_dict(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    goal = (await db.execute(select(Goal).where(Goal.goal_id == goal_id))).scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status in LOCKED_STATUSES:
        raise HTTPException(status_code=400, detail="Cannot delete a goal with this status.")

    await db.delete(goal)
    await db.commit()
    return None
