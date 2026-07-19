from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

# Create asynchronous SQLAlchemy engine
# pool_size and max_overflow are set for concurrent connections scale-out.
# pool_pre_ping=True ensures stale connections are recycled gracefully.
engine = create_async_engine(
    settings.async_database_url,
    pool_size=20,
    max_overflow=10,
    pool_recycle=1800,
    pool_pre_ping=True,
)

# AsyncSessionmaker binds session execution to the async engine
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
