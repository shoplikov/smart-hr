import logging

from langfuse import observe
from langfuse.openai import AsyncOpenAI
from openai.lib._parsing._completions import type_to_response_format_param

from src.core.config import settings
from src.core.prompt_manager import prompt_manager
from src.models.llm_schemas import GoalGenerationResult
from src.services.rag_service import rag_service

logger = logging.getLogger(__name__)


class GoalGeneratorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = (
            "gpt-4o-mini"
        )

    @observe()
    async def generate_goals(
        self, role: str, department: str, quarter: int, year: int
    ) -> GoalGenerationResult:
        logger.info(f"Generating goals for {role} in {department} (Q{quarter} {year})")

        search_query = f"Стратегические цели, приоритеты и OKR для {department} на {quarter} квартал {year} года. Роль: {role}"

        context = await rag_service.search_relevant_context(
            query=search_query, department_scope=department, top_k=3
        )

        context_block = (
            f"\nКорпоративный контекст (из базы знаний):\n{context}"
            if context
            else "\nКорпоративный контекст не найден. Используйте общие лучшие практики для этой роли."
        )

        system_prompt = prompt_manager.get_prompt("goal_generator", "system")
        user_prompt = prompt_manager.get_prompt(
            "goal_generator",
            "user",
            role=role,
            department=department,
            quarter=quarter,
            year=year,
            context_block=context_block,
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=type_to_response_format_param(GoalGenerationResult),
            temperature=0.6,
        )

        return GoalGenerationResult.model_validate_json(
            response.choices[0].message.content
        )


goal_generator = GoalGeneratorService()
