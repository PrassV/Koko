import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Successfully imported app.main")
    from app.models import User, Property, Unit
    print("Successfully imported models")
    print("Verification Successful")
except Exception as e:
    print(f"Verification Failed: {e}")
    sys.exit(1)
