"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db.models import User
from app.core.security import (
    verify_google_token,
    create_access_token,
    get_current_user,
    TokenPayload,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate via Google ID token.
    
    This endpoint:
    1. Validates the Google ID token.
    2. Creates or updates the user in the database.
    3. Issues a JWT for subsequent requests.
    """
    # Verify Google token
    google_user = await verify_google_token(request.id_token)

    # Find or create user
    user = db.query(User).filter(User.google_id == google_user.sub).first()
    if not user:
        user = User(
            email=google_user.email,
            name=google_user.name,
            google_id=google_user.sub,
        )
        # Generate initial connection code
        user.generate_connection_code()
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info if changed
        if user.email != google_user.email or user.name != google_user.name:
            user.email = google_user.email
            user.name = google_user.name
            db.commit()

    # Create JWT
    access_token = create_access_token(
        subject=str(user.id),
        email=user.email,
        name=user.name,
    )

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current authenticated user."""
    user = db.query(User).filter(User.id == int(current_user.sub)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
