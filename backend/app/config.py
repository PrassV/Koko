from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    FIREBASE_CREDENTIALS_JSON: str | None = None
    
    class Config:
        env_file = ".env"

settings = Settings()
