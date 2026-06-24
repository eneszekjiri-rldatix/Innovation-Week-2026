from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


load_dotenv()


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://audit:audit@localhost:5433/audit"
    aws_region: str = "eu-west-1"
    bedrock_model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    max_frames: int = 20
    upload_dir: Path = Path("uploads")
    results_dir: Path = Path("results")
    use_mock: bool = False

    model_config = {"env_prefix": "HYGIENE_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.results_dir.mkdir(parents=True, exist_ok=True)
