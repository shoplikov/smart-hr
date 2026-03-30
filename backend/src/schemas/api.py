from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field



class GoalCreate(BaseModel):
    goal_text: str = Field(..., description="Текст цели")
    metric: Optional[str] = Field(None, description="Ключ KPI-метрики из kpi_catalog (необязательно)")
    deadline: Optional[str] = Field(None, description="Дедлайн цели в формате YYYY-MM-DD (необязательно)")
    quarter: int = Field(..., ge=1, le=4, description="Квартал (1-4)")
    year: int = Field(..., ge=2020, description="Год")
    employee_id: int = Field(..., description="ID сотрудника")
    department_id: int = Field(..., description="ID отдела")


class GoalUpdate(BaseModel):
    goal_text: str = Field(..., description="Текст цели")
    metric: Optional[str] = Field(None, description="Ключ KPI-метрики из kpi_catalog (необязательно)")
    deadline: Optional[str] = Field(None, description="Дедлайн цели в формате YYYY-MM-DD (необязательно)")


class GoalStatusUpdate(BaseModel):
    status: str


class GoalResponse(BaseModel):
    id: str
    goal_text: str
    metric: Optional[str] = None
    metric_title: Optional[str] = None
    deadline: Optional[str] = None
    quarter: int
    year: int
    employee_id: int
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}



class GoalEvaluateRequest(BaseModel):
    goal_text: str = Field(..., description="Текст цели для оценки")
    context: Optional[str] = Field(None, description="Контекст проекта/отдела для оценки релевантности")
    employee_id: Optional[int] = Field(None, description="ID сотрудника для автоматического поиска контекста")


class GoalGenerateRequest(BaseModel):
    role: str = Field(
        ..., description="Должность сотрудника (например, 'Frontend Developer')"
    )
    department: str = Field(..., description="Отдел (например, 'Engineering')")
    quarter: int = Field(..., ge=1, le=4)
    year: int = Field(..., ge=2020)



class GoalReviewCreate(BaseModel):
    verdict: str = Field(
        ..., description="Вердикт: approve, reject, needs_changes, comment_only"
    )
    comment_text: str = Field(..., description="Комментарий к ревью")
    reviewer_id: int = Field(..., description="ID руководителя-ревьюера")



class ChartDataPoint(BaseModel):
    name: str
    value: float


class DashboardResponse(BaseModel):
    kpi_name: str
    unit: str
    data: list[ChartDataPoint]
