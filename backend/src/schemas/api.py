from typing import Optional

from pydantic import BaseModel, Field


# Goals Schemas
class GoalBase(BaseModel):
    title: str = Field(..., description="Название цели")
    description: str = Field(..., description="Описание цели")
    quarter: int = Field(..., ge=1, le=4, description="Квартал (1-4)")
    year: int = Field(..., ge=2020, description="Год")


class GoalCreate(GoalBase):
    employee_id: int = Field(..., description="ID сотрудника")


class GoalResponse(GoalBase):
    id: int
    employee_id: int
    status: str

    model_config = {"from_attributes": True}


class GoalStatusUpdate(BaseModel):
    status: str


class GoalUpdate(BaseModel):
    title: str
    description: str
    quarter: Optional[int] = None
    year: Optional[int] = None


# AI Schemas
class EvaluateGoalRequest(BaseModel):
    title: str = Field(..., description="Название цели для оценки")
    description: str = Field(..., description="Описание цели для оценки")


class GenerateGoalsRequest(BaseModel):
    role: str = Field(
        ..., description="Должность сотрудника (например, 'Frontend Developer')"
    )
    department: str = Field(..., description="Отдел (например, 'Engineering')")
    quarter: int = Field(..., ge=1, le=4)
    year: int = Field(..., ge=2020)


# Analytics Schemas
class KpiDataPoint(BaseModel):
    period: str
    value: float

    model_config = {"from_attributes": True}


class ChartDataPoint(BaseModel):
    name: str
    value: float


class DashboardResponse(BaseModel):
    kpi_name: str
    unit: str
    data: list[ChartDataPoint]