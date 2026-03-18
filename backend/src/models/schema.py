import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSONB, UUID
from src.models.base import Base


# --- ENUMS ---
class DocTypeEnum(str, enum.Enum):
    vnd = "vnd"
    strategy = "strategy"
    policy = "policy"
    kpi_framework = "kpi_framework"
    regulation = "regulation"
    instruction = "instruction"
    standard = "standard"
    other = "other"


class GoalEventTypeEnum(str, enum.Enum):
    created = "created"
    edited = "edited"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"
    status_changed = "status_changed"
    commented = "commented"
    archived = "archived"


class GoalStatusEnum(str, enum.Enum):
    draft = "draft"
    active = "active"
    submitted = "submitted"
    approved = "approved"
    in_progress = "in_progress"
    done = "done"
    cancelled = "cancelled"
    overdue = "overdue"
    archived = "archived"


class QuarterEnum(str, enum.Enum):
    Q1 = "Q1"
    Q2 = "Q2"
    Q3 = "Q3"
    Q4 = "Q4"


class ProjectStatusEnum(str, enum.Enum):
    active = "active"
    done = "done"


class SystemTypeEnum(str, enum.Enum):
    hr = "hr"
    other = "other"


# --- MODELS ---
class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    code = Column(Text, unique=True)
    parent_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"))
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )


class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    grade = Column(Text)


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_code = Column(Text, unique=True)
    full_name = Column(Text, nullable=False)
    email = Column(Text, unique=True)
    department_id = Column(
        Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    position_id = Column(
        Integer, ForeignKey("positions.id", ondelete="RESTRICT"), nullable=False
    )
    manager_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"))
    hire_date = Column(Date)
    is_active = Column(Boolean, default=True, nullable=False)


class Document(Base):
    __tablename__ = "documents"
    doc_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_type = Column(ENUM(DocTypeEnum, create_type=False), nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date)
    owner_department_id = Column(
        Integer, ForeignKey("departments.id", ondelete="SET NULL")
    )
    department_scope = Column(JSONB)
    keywords = Column(ARRAY(Text))
    version = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Goal(Base):
    __tablename__ = "goals"
    goal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(
        Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    department_id = Column(
        Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    goal_text = Column(Text, nullable=False)
    year = Column(SmallInteger, nullable=False)
    quarter = Column(
        ENUM(QuarterEnum, name="quarter_enum", create_type=False), nullable=False
    )
    metric = Column(Text)
    deadline = Column(Date)
    weight = Column(Numeric(5, 2), default=1.00, nullable=False)
    status = Column(
        ENUM(GoalStatusEnum, name="goal_status_enum", create_type=False),
        default=GoalStatusEnum.draft,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )


class KpiCatalog(Base):
    __tablename__ = "kpi_catalog"
    metric_key = Column(Text, primary_key=True)
    title = Column(Text, nullable=False)
    unit = Column(Text, nullable=False)


class KpiTimeseries(Base):
    __tablename__ = "kpi_timeseries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scope_type = Column(Text, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"))
    metric_key = Column(
        Text, ForeignKey("kpi_catalog.metric_key", ondelete="RESTRICT"), nullable=False
    )
    period_date = Column(Date, nullable=False)
    value_num = Column(Numeric(18, 6), nullable=False)
