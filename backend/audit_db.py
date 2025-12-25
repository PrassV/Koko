import asyncio
from sqlalchemy import text
from app.database import engine, DATABASE_URL

async def audit_db():
    print(f"Checking Database Connection...")
    
    url_str = str(DATABASE_URL)
    try:
        from urllib.parse import urlparse
        # Handle postgresql+psycopg:// schema for parsing
        clean_url = url_str.replace("postgresql+psycopg://", "postgresql://")
        u = urlparse(clean_url)
        print(f"--> CONNECTING TO HOST: {u.hostname}")
        print(f"--> CONNECTING TO PORT: {u.port}")
        print(f"--> CONNECTING TO DB:   {u.path.lstrip('/')}")
    except Exception as e:
        print(f"Could not parse URL: {e}")

    try:
        async with engine.connect() as conn:
            print("Connection Successful!")
            
            # List Tables
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
            tables = result.scalars().all()
            
            if not tables:
                print("!! CRITICAL: No tables found in 'public' schema !!")
            else:
                print(f"Tables found ({len(tables)}):")
                for t in tables:
                    print(f" - {t}")
                    
            # Check for migrations table
            if 'alembic_version' in tables:
                v = await conn.execute(text("SELECT * FROM alembic_version"))
                print(f"Current Migration Version: {v.scalars().first()}")
            else:
                print("No alembic_version table found.")

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(audit_db())
