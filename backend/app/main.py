from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.core.http_client import close_http_client
from app.db.init_db import init_db
from app.jobs.scheduler import scheduler

# 1. Initialize structured logging
setup_logging()


# 2. Define FastAPI lifespan context for background schedulers & connection pools
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks:
    await init_db()
    scheduler.start()
    yield
    # Shutdown tasks:
    scheduler.shutdown()
    await close_http_client()


# 3. Instantiate FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# 4. Attach middlewares — order matters: add_middleware wraps in reverse, so the LAST
#    added middleware is the OUTERMOST (first to handle requests, last to handle responses).
#    Desired execution order: CORSMiddleware → RequestIdMiddleware → ErrorHandlerMiddleware → app
#    So we add them in reverse: ErrorHandler first, then RequestId, then CORS last (outermost).

# In development, allow all localhost origins dynamically to avoid Vite port-shift issues
cors_origins = settings.BACKEND_CORS_ORIGINS
if settings.ENV == "development":
    cors_origins = [
        "http://localhost:3000", "http://localhost:5173", "http://localhost:5174",
        "http://localhost:5175", "http://localhost:5176", "http://localhost:5177",
        "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174",
        "http://127.0.0.1:5175", "http://127.0.0.1:5176", "http://127.0.0.1:5177",
    ]

# Added last = outermost = runs first on request AND last on response (wraps everything)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Include API versioned routing
app.include_router(api_router, prefix=settings.API_V1_STR)


# 6. Global health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Verify backend system status."""
    return {"status": "healthy"}
