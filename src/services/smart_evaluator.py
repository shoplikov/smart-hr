import logging

from openai import AsyncOpenAI

from src.core.config import settings
from src.models.llm_schemas import SmartEvaluationResult

logger = logging.getLogger(__name__)


class SmartEvaluatorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"

    async def evaluate_goal(
        self, title: str, description: str
    ) -> SmartEvaluationResult:
        logger.info(f"Evaluating goal via LLM: {title}")

        system_prompt = (
            "Вы — опытный HR-эксперт и бизнес-коуч. Ваша задача — оценить предложенную цель "
            "сотрудника по методологии SMART (Specific, Measurable, Achievable, Relevant, Time-bound). "
            "Будьте объективны, строги, но конструктивны. Всегда предлагайте варианты улучшения, "
            "если критерий не выполнен. Отвечайте исключительно на русском языке."
        )
        user_prompt = f"Название цели: {title}\nОписание: {description}"

        # Native structured output parsing guarantees matching the Pydantic schema
        response = await self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=SmartEvaluationResult,
            temperature=0.2,
        )

        return response.choices[0].message.parsed


smart_evaluator = SmartEvaluatorService()
