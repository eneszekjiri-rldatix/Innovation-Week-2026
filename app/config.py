from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    aws_region: str = "eu-west-1"
    bedrock_model_id: str = "anthropic.claude-sonnet-4-20250514"
    max_frames: int = 20
    upload_dir: Path = Path("uploads")
    results_dir: Path = Path("results")
    use_mock: bool = True

    model_config = {"env_prefix": "HYGIENE_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.results_dir.mkdir(parents=True, exist_ok=True)
