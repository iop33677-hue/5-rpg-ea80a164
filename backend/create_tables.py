import os
from sqlalchemy import create_engine
from app.database import Base
from app.models import *

database_url = os.environ.get("DATABASE_URL")
schema_name = os.environ.get("SCHEMA_NAME", "public")

engine = create_engine(database_url, connect_args={"options": f"-c search_path={schema_name}"})
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
