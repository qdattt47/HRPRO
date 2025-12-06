from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Engine kết nối MySQL
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency cung cấp session theo yêu cầu cho FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
