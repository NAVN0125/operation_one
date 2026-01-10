"""
Analysis API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db.models import Call, Transcript, Analysis
from app.core.security import get_current_user, TokenPayload
from app.services.analysis_service import analysis_service


router = APIRouter(prefix="/analysis", tags=["analysis"])


class AnalyzeCallRequest(BaseModel):
    user_interpretation: str


class AnalysisResponse(BaseModel):
    id: int
    call_id: int
    user_interpretation: Optional[str]
    result: Optional[str]

    class Config:
        from_attributes = True


@router.post("/{call_id}", response_model=AnalysisResponse)
async def analyze_call(
    call_id: int,
    request: AnalyzeCallRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a completed call.
    
    Requires the call transcript and user's interpretation guidelines.
    """
    # Get call and transcript
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    transcript = db.query(Transcript).filter(Transcript.call_id == call_id).first()
    if not transcript or not transcript.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript available for this call",
        )

    # Check if analysis already exists
    existing_analysis = db.query(Analysis).filter(Analysis.call_id == call_id).first()
    if existing_analysis:
        # Update existing analysis
        try:
            result = await analysis_service.analyze_call(
                transcript=transcript.content,
                user_interpretation=request.user_interpretation,
            )
            existing_analysis.user_interpretation = request.user_interpretation
            existing_analysis.result = result
            db.commit()
            db.refresh(existing_analysis)
            return existing_analysis
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e),
            )

    # Create new analysis
    try:
        result = await analysis_service.analyze_call(
            transcript=transcript.content,
            user_interpretation=request.user_interpretation,
        )

        analysis = Analysis(
            call_id=call_id,
            user_interpretation=request.user_interpretation,
            result=result,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{call_id}", response_model=AnalysisResponse)
async def get_analysis(
    call_id: int,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get analysis for a call."""
    analysis = db.query(Analysis).filter(Analysis.call_id == call_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return analysis


@router.post("/{call_id}/transcript")
async def save_transcript(
    call_id: int,
    content: str,
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update call transcript."""
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    transcript = db.query(Transcript).filter(Transcript.call_id == call_id).first()
    if transcript:
        transcript.content = content
    else:
        transcript = Transcript(call_id=call_id, content=content)
        db.add(transcript)

    db.commit()
    return {"message": "Transcript saved"}
