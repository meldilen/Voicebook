from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    
    PRIVATE_KEY_PATH: str = "../scripts/private.pem"
    PUBLIC_KEY_PATH: str = "../scripts/public.pem"
    ALGORITHM: str = "RS256"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_CLEANUP_DAYS: int = 30

    MAX_SESSIONS_PER_USER: int = 5
    SESSION_INACTIVITY_LIMIT_DAYS: int = 30

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    COOKIE_DOMAIN: str = "localhost"
    SECURE_COOKIES: bool = False # True в production

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