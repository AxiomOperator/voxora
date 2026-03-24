from sqlmodel import SQLModel
from app.db.database import engine
from app import models  # noqa: F401 — import models so SQLModel picks them up


def init_db():
    SQLModel.metadata.create_all(engine)
