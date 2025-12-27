import sys
import os
import re
from dotenv import load_dotenv

# Load .env file
load_dotenv()

print("--- Starting Diagnostic Check ---")

# 1. Check Python Version
print(f"Python Version: {sys.version}")

# 2. Check Imports
try:
    import psycopg
    print("SUCCESS: psycopg (v3) is installed.")
except ImportError:
    print("FAILURE: psycopg (v3) is NOT installed.")

try:
    import sqlalchemy
    print(f"SUCCESS: sqlalchemy is installed (version {sqlalchemy.__version__}).")
except ImportError:
    print("FAILURE: sqlalchemy is NOT installed.")

# 3. Simulate Database URL Logic
print("\n--- Testing Database URL Logic ---")
raw_url = os.getenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
print(f"Raw DATABASE_URL (masked): {re.sub(r':([^@]+)@', ':****@', raw_url)}")

processed_url = raw_url
if processed_url.startswith("postgres://"):
    processed_url = processed_url.replace("postgres://", "postgresql+psycopg://", 1)
elif processed_url.startswith("postgresql://"):
    processed_url = processed_url.replace("postgresql://", "postgresql+psycopg://", 1)

print(f"Processed DATABASE_URL (masked): {re.sub(r':([^@]+)@', ':****@', processed_url)}")

# 4. Try creating engine
print("\n--- Testing Engine Creation ---")
try:
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(processed_url)
    print("SUCCESS: create_async_engine created engine object.")
except Exception as e:
    print(f"FAILURE: create_async_engine failed: {e}")

# 5. Check Firebase
print("\n--- Testing Firebase Config ---")
fb_creds = os.getenv("FIREBASE_CREDENTIALS_JSON")
if fb_creds:
    print("FIREBASE_CREDENTIALS_JSON is set.")
    try:
        import json
        json.loads(fb_creds)
        print("SUCCESS: FIREBASE_CREDENTIALS_JSON is valid JSON.")
    except Exception as e:
        print(f"FAILURE: FIREBASE_CREDENTIALS_JSON is invalid JSON: {e}")
else:
    print("WARNING: FIREBASE_CREDENTIALS_JSON is NOT set.")

print("\n--- Diagnostic Check Complete ---")
