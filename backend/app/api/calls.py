"""
Call API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.db.session import get_db
from app.db.models import Call, CallStatus, UserConnection
from app.core.security import get_current_user, TokenPayload


router = APIRouter(prefix="/calls", tags=["calls"])


class InitiateCallRequest(BaseModel):
    target_user_id: int  # Required: ID of the user to call
    room_name: Optional[str] = None


class CallInitiateResponse(BaseModel):
    room_name: str
    call_id: int


class CallResponse(BaseModel):
    id: int
    room_id: Optional[str]
    status: str
    started_at: Optional[str]
    ended_at: Optional[str]

    class Config:
        from_attributes = True


@router.post("/initiate", response_model=CallInitiateResponse)
async def initiate_call(
    request: InitiateCallRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initiate a new call to a connected user.
    
    Requires target_user_id and verifies connection exists.
    Returns a call_id to be used with WebSocket connections.
    """
    caller_id = int(current_user.sub)
    callee_id = request.target_user_id
    
    # Verify users are connected (bidirectional check)
    connection = db.query(UserConnection).filter(
        ((UserConnection.user_id == caller_id) & (UserConnection.connected_user_id == callee_id)) |
        ((UserConnection.user_id == callee_id) & (UserConnection.connected_user_id == caller_id))
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only call users in your connections",
        )
    
    # Generate room name if not provided
    room_name = request.room_name or f"call-{uuid.uuid4().hex[:8]}"

    # Create call record with both participants
    call = Call(
        user_id=caller_id,  # Kept for backward compatibility
        caller_id=caller_id,
        callee_id=callee_id,
        room_id=room_name,
        status=CallStatus.INITIATED,
    )
    db.add(call)
    db.commit()
    db.refresh(call)

    return CallInitiateResponse(
        room_name=room_name,
        call_id=call.id,
    )


@router.post("/{call_id}/answer")
async def answer_call(
    call_id: int,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a call as answered/picked up.
    
    This triggers the start of transcription.
    """
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    call.status = CallStatus.PICKED_UP
    db.commit()

    return {"message": "Call answered", "status": CallStatus.PICKED_UP.value}


@router.post("/{call_id}/end")
async def end_call(
    call_id: int,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End a call."""
    from datetime import datetime

    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    call.status = CallStatus.ENDED
    call.ended_at = datetime.utcnow()

    if call.started_at:
        duration = (call.ended_at - call.started_at).total_seconds()
        call.duration_seconds = int(duration)

    db.commit()

    return {"message": "Call ended", "duration_seconds": call.duration_seconds}


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: int,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get call details."""
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    return CallResponse(
        id=call.id,
        room_id=call.room_id,
        status=call.status.value,
        started_at=call.started_at.isoformat() if call.started_at else None,
        ended_at=call.ended_at.isoformat() if call.ended_at else None,
    )
