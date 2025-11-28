from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DEBUG: bool = False

    DATABASE_URL: str
    
    PRIVATE_KEY_PATH: str = "scripts/private.pem"
    PUBLIC_KEY_PATH: str = "scripts/public.pem"
    ALGORITHM: str = "RS256"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_CLEANUP_DAYS: int = 30

    MAX_SESSIONS_PER_USER: int = 5
    SESSION_INACTIVITY_LIMIT_DAYS: int = 30

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000","http://127.0.0.1:3000"]

    COOKIE_DOMAIN: str = "localhost"
    SECURE_COOKIES: bool = True if DEBUG == False else False  # True в production

    # Yandex Cloud ML настройки
    SERVICE_ACCOUNT_ID: str
    KEY_ID: str
    PRIVATE_KEY: str  # Приватный ключ для JWT
    FOLDER_ID: str
    BUCKET_NAME: str
    SECRET_KEY: str  # Секретный ключ для Object Storage
    SECRET_KEY_ID: str  # Key ID для Object Storage

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def get_private_key(self) -> str:
        with open(self.PRIVATE_KEY_PATH, "r") as key_file:
            return key_file.read()
    
    def get_public_key(self) -> str:
        with open(self.PUBLIC_KEY_PATH, "r") as key_file:
            return key_file.read()


settings = Settings()