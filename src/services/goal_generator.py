import logging

from openai import AsyncOpenAI

from src.core.config import settings
from src.models.llm_schemas import GoalGenerationResult
from src.services.rag_service import rag_service

logger = logging.getLogger(__name__)


class GoalGeneratorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"

    async def generate_goals(
        self, role: str, department: str, quarter: int, year: int
    ) -> GoalGenerationResult:
        logger.info(f"Generating goals for {role} in {department} (Q{quarter} {year})")

        # 1. Retrieve strategic context via RAG
        search_query = f"Стратегические цели, приоритеты и OKR для {department} на {quarter} квартал {year} года. Роль: {role}"
        context = await rag_service.search_relevant_context(
            query=search_query, department_scope=department, top_k=3
        )

        context_block = (
            f"\nКорпоративный контекст (из базы знаний):\n{context}"
            if context
            else "\nКорпоративный контекст не найден. Используйте общие лучшие практики для этой роли."
        )

        # 2. Construct prompts
        system_prompt = (
            "Вы — AI-ассистент HR-директора. Ваша задача — сгенерировать 3-5 профессиональных целей "
            "по методологии SMART для сотрудника на основе его роли, отдела и корпоративного контекста. "
            "Цели должны быть амбициозными, но достижимыми, и строго соответствовать стратегии компании. "
            "Формулируйте текст профессиональным бизнес-языком на русском."
        )
        user_prompt = (
            f"Роль сотрудника: {role}\n"
            f"Отдел: {department}\n"
            f"Период: Q{quarter} {year}\n"
            f"{context_block}\n\n"
            "Сгенерируйте цели, опираясь на предоставленный контекст."
        )

        # 3. Generate structured response
        response = await self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=GoalGenerationResult,
            temperature=0.5,
        )

        return response.choices[0].message.parsed


goal_generator = GoalGeneratorService()
