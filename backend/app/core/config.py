"""
Configuration settings for DDSS Backend
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    APP_NAME: str = "DDSS Backend"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Database
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    
    # Audio Processing
    WHISPER_MODEL_PATH: str = "./models/whisper.cpp"
    AUDIO_SAMPLE_RATE: int = 16000
    
    # LLM
    LLM_PROVIDER: str = "openai"  # or "local"
    LLM_MODEL: str = "gpt-4"
    LLM_API_KEY: Optional[str] = None
    
    # FHIR
    FHIR_ENABLED: bool = False
    FHIR_SERVER_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
