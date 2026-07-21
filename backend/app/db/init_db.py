import logging
from app.db.base import Base
from app.db.session import engine

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Initialize database tables for all registered SQLAlchemy ORM models."""
    logger.info("Initializing PostgreSQL database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
