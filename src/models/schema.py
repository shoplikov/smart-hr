from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))

    # Relationships
    parent = relationship("Department", remote_side=[id], backref="sub_departments")
    employees = relationship("Employee", back_populates="department")


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    grade: Mapped[str] = mapped_column(String(50))


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id"))
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))

    # Relationships
    department = relationship("Department", back_populates="employees")
    position = relationship("Position")
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
    goals = relationship("Goal", back_populates="employee")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)


class EmployeeProject(Base):
    __tablename__ = "employee_projects"

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(100))
    allocation_percent: Mapped[float] = mapped_column(Float, default=100.0)


class Document(Base):
    """Корпоративные регламенты, стратегии и документы для RAG."""

    __tablename__ = "documents"

    doc_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    valid_from: Mapped[date] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)
    owner_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id")
    )
    department_scope: Mapped[str | None] = mapped_column(String(255))
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)


class Goal(Base):
    """Цели сотрудников (SMART)."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT")
    quarter: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(Integer)

    # Relationships
    employee = relationship("Employee", back_populates="goals")
    events = relationship("GoalEvent", back_populates="goal")
    reviews = relationship("GoalReview", back_populates="goal")


class GoalEvent(Base):
    """История изменений целей для аналитики и аудита."""

    __tablename__ = "goal_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    old_status: Mapped[str | None] = mapped_column(String(50))
    new_status: Mapped[str | None] = mapped_column(String(50))
    old_text: Mapped[str | None] = mapped_column(Text)
    new_text: Mapped[str | None] = mapped_column(Text)

    # Relationships
    goal = relationship("Goal", back_populates="events")


class GoalReview(Base):
    """Оценка целей менеджерами или HR."""

    __tablename__ = "goal_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    verdict: Mapped[str] = mapped_column(Text)

    # Relationships
    goal = relationship("Goal", back_populates="reviews")


class KpiCatalog(Base):
    __tablename__ = "kpi_catalog"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)


class KpiTimeseries(Base):
    __tablename__ = "kpi_timeseries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    kpi_id: Mapped[int] = mapped_column(ForeignKey("kpi_catalog.id"), index=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    period: Mapped[date] = mapped_column(Date, index=True)
    value: Mapped[float] = mapped_column(Float)
