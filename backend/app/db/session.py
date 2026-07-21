from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" in settings.async_database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_recycle": 1800,
    })

# Create asynchronous SQLAlchemy engine
engine = create_async_engine(
    settings.async_database_url,
    **engine_kwargs
)

# AsyncSessionmaker binds session execution to the async engine
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
