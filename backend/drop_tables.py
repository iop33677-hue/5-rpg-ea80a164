import os
from sqlalchemy import create_engine, text

database_url = os.environ.get("DATABASE_URL")
schema_name = os.environ.get("SCHEMA_NAME", "public")

engine = create_engine(database_url)
with engine.connect() as conn:
    conn.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
    conn.execute(text(f"CREATE SCHEMA {schema_name}"))
    conn.commit()
print("Dropped all tables in schema")
