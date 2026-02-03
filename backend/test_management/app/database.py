"""
Database connection and session management for Test Management Service
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from core.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Check connections before use
    pool_recycle=300,     # Recycle connections after 5 minutes
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """
    Get database session context manager.
    Usage:
        with get_db() as db:
            # Use db session
            user = db.query(User).first()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables"""
    # Import all models here to ensure they are registered
    from app.models import project, user
    Base.metadata.create_all(bind=engine)


def get_db_session() -> Session:
    """Get a new database session"""
    return SessionLocal()


def close_db() -> None:
    """Close database connections"""
    engine.dispose()