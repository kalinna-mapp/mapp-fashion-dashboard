# config.py — Pydantic Settings
# All values come from .env — never hardcode credentials here.

from pathlib import Path
from pydantic_settings import BaseSettings

# Always look for .env in the same directory as this file
ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    # Mode
    use_mock: bool = True

    # Kafka (Mapp Data Stream)
    kafka_bootstrap_servers: str = ""
    kafka_username: str = ""
    kafka_password: str = ""
    kafka_topic: str = ""
    kafka_group_id: str = "fashion-dashboard-consumer"

    # Mapp Analytics API (historical — not yet wired)
    mapp_client_id: str = ""
    mapp_client_secret: str = ""
    mapp_api_base_url: str = "https://intelligence.eu.mapp.com/analytics/api"

    # CORS
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
print(f"[Config] USE_MOCK={settings.use_mock}  KAFKA_TOPIC={settings.kafka_topic or '(not set)'}")
