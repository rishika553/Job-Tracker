from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.jobs.scheduler import scheduler

# 1. Initialize structured logging
setup_logging()


# 2. Define FastAPI lifespan context for background schedulers
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks:
    scheduler.start()
    yield
    # Shutdown tasks:
    scheduler.shutdown()


# 3. Instantiate FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# 4. Attach generic middlewares (executed in reverse order of attachment)
app.add_middleware(CORSMiddleware,
                   allow_origins=settings.BACKEND_CORS_ORIGINS,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])
app.add_middleware(RequestIdMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# 5. Include API versioned routing
app.include_router(api_router, prefix=settings.API_V1_STR)


# 6. Global health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Verify backend system status."""
    return {"status": "healthy"}
