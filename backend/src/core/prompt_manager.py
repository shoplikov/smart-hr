import logging
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)


class PromptManager:
    def __init__(self, filepath: str = "prompts.yaml"):
        self.filepath = Path(filepath)
        self.prompts = self._load_prompts()

    def _load_prompts(self) -> dict:
        if not self.filepath.exists():
            logger.error(f"Prompt file not found at {self.filepath}")
            raise FileNotFoundError(f"Missing {self.filepath}")

        with open(self.filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def get_prompt(self, service_name: str, prompt_type: str, **kwargs) -> str:
        try:
            template = self.prompts[service_name][prompt_type]
        except KeyError as e:
            logger.error(f"Missing prompt configuration for {service_name}.{prompt_type}")
            raise KeyError(f"Prompt key missing: {e}") from e

        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error(f"Missing required format variable for prompt: {e}")
            raise ValueError(f"Missing variable for prompt formatting: {e}") from e

prompt_manager = PromptManager()
