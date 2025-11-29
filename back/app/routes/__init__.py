from .auth import router as auth_router
from .users import router as users_router
from .records import router as records_router
from .achievements import router as achievements_router

__all__ = [
    "auth_router",
    "users_router",
    "records_router",
    "achievements_router"
]
