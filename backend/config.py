# config.py — Pydantic Settings + YAML report config loader
from pathlib import Path
from pydantic_settings import BaseSettings
import yaml

ENV_FILE   = Path(__file__).parent / ".env"
YAML_FILE  = Path(__file__).parent / "mapp_reports.yaml"


class Settings(BaseSettings):
    use_mock: bool = True

    # Kafka
    kafka_bootstrap_servers: str = ""
    kafka_username: str = ""
    kafka_password: str = ""
    kafka_topic: str = ""
    kafka_group_id: str = "fashion-dashboard-consumer"

    # Mapp Analytics API credentials
    mapp_client_id: str = ""
    mapp_client_secret: str = ""
    mapp_account_id: str = ""
    mapp_api_base_url: str = "https://intelligence.eu.mapp.com/analytics/api"

    # LiteLLM proxy
    litellm_api_key: str = ""
    litellm_base_url: str = "https://llm-proxy.labs.mapp.com"
    app_name: str = "mapp-fashion-dashboard"
    app_product: str = "fashion"

    # CORS
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = False


def load_reports() -> dict:
    """Load MI report configuration from mapp_reports.yaml."""
    if not YAML_FILE.exists():
        raise FileNotFoundError(f"Report config not found: {YAML_FILE}")
    with open(YAML_FILE, encoding="utf-8") as f:
        return yaml.safe_load(f)


settings = Settings()
reports  = load_reports()

print(
    f"[Config] USE_MOCK={settings.use_mock}  "
    f"KAFKA_TOPIC={settings.kafka_topic or '(not set)'}  "
    f"MI_API={'✓' if settings.mapp_client_id else '✗ not configured'}  "
    f"Reports={list(reports.keys())}"
)
