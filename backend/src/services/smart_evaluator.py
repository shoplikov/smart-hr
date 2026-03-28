import logging

from langfuse import observe
from langfuse.openai import AsyncOpenAI
from openai.lib._parsing._completions import type_to_response_format_param

from src.core.config import settings
from src.core.prompt_manager import prompt_manager
from src.models.llm_schemas import GoalEvaluationResult
from src.services.rag_service import rag_service

logger = logging.getLogger(__name__)


class SmartEvaluatorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o-mini"

    @observe()
    async def evaluate_goal(
        self, goal_text: str, context: str = "Общий корпоративный контекст"
    ) -> GoalEvaluationResult:
        logger.info(f"Evaluating SMART criteria for goal: {goal_text[:80]}")
        logger.info(f"Context used for evaluation: {context[:500]}...")

        system_prompt = prompt_manager.get_prompt("smart_evaluator", "system")
        user_prompt = prompt_manager.get_prompt(
            "smart_evaluator",
            "user",
            goal_text=goal_text,
            context=context,
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format=type_to_response_format_param(GoalEvaluationResult),
            temperature=0.3,
        )

        return GoalEvaluationResult.model_validate_json(
            response.choices[0].message.content
        )


smart_evaluator = SmartEvaluatorService()
