from pydantic import BaseModel, Field


class SmartCriterion(BaseModel):
    is_met: bool = Field(description="Выполнен ли данный критерий SMART")
    reasoning: str = Field(description="Краткое обоснование оценки")
    suggestion: str | None = Field(
        description="Конкретное предложение по улучшению формулировки (если критерий не выполнен)"
    )


class SmartEvaluationResult(BaseModel):
    """Pydantic schema enforcing the exact structure of the SMART evaluation output."""

    s_specific: SmartCriterion
    m_measurable: SmartCriterion
    a_achievable: SmartCriterion
    r_relevant: SmartCriterion
    t_time_bound: SmartCriterion
    overall_score: int = Field(description="Общий балл качества цели от 0 до 100")
    final_recommendation: str = Field(
        description="Итоговая рекомендация по переформулированию цели"
    )


class GeneratedGoal(BaseModel):
    title: str = Field(description="Краткое название цели")
    description: str = Field(
        description="Подробное описание цели, соответствующее критериям SMART"
    )
    metrics: list[str] = Field(description="Список ключевых метрик успеха (KPIs)")


class GoalGenerationResult(BaseModel):
    """Pydantic schema enforcing the output structure for generated goals."""

    goals: list[GeneratedGoal]
    strategic_alignment: str = Field(
        description="Объяснение того, как эти цели связаны со стратегией компании (на основе предоставленного контекста)"
    )
