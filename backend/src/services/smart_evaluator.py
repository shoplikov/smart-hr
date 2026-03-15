import logging

from openai import AsyncOpenAI

from src.core.config import settings
from src.core.prompt_manager import prompt_manager
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

        system_prompt = prompt_manager.get_prompt("smart_evaluator", "system")
        user_prompt = prompt_manager.get_prompt(
            "smart_evaluator", "user", title=title, description=description
        )

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
