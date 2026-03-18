from pydantic import BaseModel, Field


class SmartScores(BaseModel):
    """Per-criterion SMART scores, each 0.0–1.0."""

    specific: float = Field(..., ge=0.0, le=1.0, description="Оценка конкретности (S)")
    measurable: float = Field(
        ..., ge=0.0, le=1.0, description="Оценка измеримости (M)"
    )
    achievable: float = Field(
        ..., ge=0.0, le=1.0, description="Оценка достижимости (A)"
    )
    relevant: float = Field(
        ..., ge=0.0, le=1.0, description="Оценка актуальности (R)"
    )
    time_bound: float = Field(
        ..., ge=0.0, le=1.0, description="Оценка ограниченности во времени (T)"
    )


class GoalEvaluationResult(BaseModel):
    """Matches the hackathon spec output format for SMART evaluation."""

    smart_scores: SmartScores
    smart_index: float = Field(
        ..., ge=0.0, le=1.0, description="Агрегированный SMART-индекс от 0.0 до 1.0."
    )
    recommendations: list[str] = Field(
        ...,
        description="Список рекомендаций по улучшению (каждая с префиксом критерия, например 'S: ...').",
    )
    improved_goal: str = Field(
        ...,
        description="Улучшенная переформулировка цели, полностью соответствующая критериям SMART.",
    )


class GeneratedGoal(BaseModel):
    title: str = Field(description="Краткое название цели")
    description: str = Field(
        description="Подробное описание цели, соответствующее критериям SMART"
    )
    metrics: list[str] = Field(description="Список ключевых метрик успеха (KPIs)")
    source_document: str = Field(
        description="Название ВНД или стратегического документа, на основе которого сгенерирована цель"
    )
    source_fragment: str = Field(
        description="Релевантная цитата или фрагмент из исходного документа"
    )


class GoalGenerationResult(BaseModel):
    """Pydantic schema enforcing the output structure for generated goals."""

    goals: list[GeneratedGoal]
    strategic_alignment: str = Field(
        description="Объяснение того, как эти цели связаны со стратегией компании (на основе предоставленного контекста)"
    )
