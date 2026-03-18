from typing import Optional

from pydantic import BaseModel, Field


# --- Goal Schemas ---
class GoalCreate(BaseModel):
    title: str = Field(..., description="Название цели")
    description: str = Field(..., description="Описание цели")
    quarter: int = Field(..., ge=1, le=4, description="Квартал (1-4)")
    year: int = Field(..., ge=2020, description="Год")
    employee_id: int = Field(..., description="ID сотрудника")
    department_id: int = Field(1, description="ID отдела")


class GoalUpdate(BaseModel):
    title: str
    description: str


class GoalStatusUpdate(BaseModel):
    status: str


class GoalResponse(BaseModel):
    id: str
    title: str
    description: str
    quarter: int
    year: int
    employee_id: int
    status: str

    model_config = {"from_attributes": True}


# --- AI Request Schemas ---
class GoalEvaluateRequest(BaseModel):
    title: str = Field(..., description="Название цели для оценки")
    description: str = Field(..., description="Описание цели для оценки")


class GoalGenerateRequest(BaseModel):
    role: str = Field(
        ..., description="Должность сотрудника (например, 'Frontend Developer')"
    )
    department: str = Field(..., description="Отдел (например, 'Engineering')")
    quarter: int = Field(..., ge=1, le=4)
    year: int = Field(..., ge=2020)


# --- Analytics Schemas ---
class ChartDataPoint(BaseModel):
    name: str
    value: float


class DashboardResponse(BaseModel):
    kpi_name: str
    unit: str
    data: list[ChartDataPoint]
