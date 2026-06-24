from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


load_dotenv()


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://audit:audit@localhost:5433/audit"
    aws_region: str = "eu-west-1"
    bedrock_model_id: str = "global.amazon.nova-2-lite-v1:0"
    max_frames: int = 20
    upload_dir: Path = Path("uploads")
    saved_videos_dir: Path = Path.home() / "Desktop" / "Hand Hygiene Audit Videos"
    results_dir: Path = Path("results")
    use_mock: bool = False
    input_token_price_per_1k_usd: float = 0.0008
    output_token_price_per_1k_usd: float = 0.004

    model_config = {"env_prefix": "HYGIENE_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.saved_videos_dir.mkdir(parents=True, exist_ok=True)
settings.results_dir.mkdir(parents=True, exist_ok=True)
