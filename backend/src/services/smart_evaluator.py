import logging
from openai import AsyncOpenAI

from src.core.config import settings
from src.core.prompt_manager import prompt_manager
from src.models.llm_schemas import GoalEvaluationResult

logger = logging.getLogger(__name__)


class SmartEvaluatorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"

    async def evaluate_goal(self, goal_text: str) -> GoalEvaluationResult:
        logger.info(f"Evaluating SMART criteria for goal: {goal_text[:80]}")

        system_prompt = prompt_manager.get_prompt("smart_evaluator", "system")
        user_prompt = prompt_manager.get_prompt(
            "smart_evaluator",
            "user",
            goal_text=goal_text,
        )

        response = await self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=GoalEvaluationResult,
            temperature=0.3,
        )

        return response.choices[0].message.parsed


smart_evaluator = SmartEvaluatorService()
