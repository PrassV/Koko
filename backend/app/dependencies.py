from fastapi import Header, HTTPException, Depends, status
from firebase_admin import auth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User

async def get_current_user_uid(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    token = authorization.split("Bearer ")[1]
    try:
        # Verify the ID token while checking if the token is revoked by
        # passing check_revoked=True.
        # Note: This requires Firebase Admin to be initialized.
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        uid = decoded_token['uid']
        return uid
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token",
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired ID token",
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Revoked ID token",
        )
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

async def get_current_user(
    uid: str = Depends(get_current_user_uid),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.firebase_uid == uid))
    user = result.scalars().first()
    if not user:
        # In some flows, we might want to auto-create the user, or return 404
        # For a strict backend API, returning 404 lets the frontend know they need to "register" logic
        # OR we can just return None and handle it in the router
        return None 
        # raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(role: str):
    """
    Factory to create a dependency that checks if the user has the required role.
    """
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role != role and user.role != "ADMIN":
             # ADMIN overrides all role checks usually, or we can be strict.
             # Current app logic often allowed ADMIN fallback.
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {role} role"
            )
        return user
    return role_checker
