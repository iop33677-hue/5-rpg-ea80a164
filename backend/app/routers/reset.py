from fastapi import APIRouter
from app.database import get_engine, Base

router = APIRouter(prefix="/reset", tags=["reset"])

@router.get("")
def reset_db():
    engine = get_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"status": "success", "message": "Database reset"}
