from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "postgresql+asyncpg://sanctum:sanctum@localhost:5432/sanctum"
    database_url_sync: str = "postgresql://sanctum:sanctum@localhost:5432/sanctum"
    environment: str = "development"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
