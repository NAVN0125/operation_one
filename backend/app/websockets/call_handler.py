import json
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Call, CallStatus, Transcript
from app.core.security import verify_jwt_token
from app.websockets.connection_manager import manager
from app.services.transcription_service import transcription_service

router = APIRouter()

@router.websocket("/ws/call/{call_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    call_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    # Verify JWT from query param (common for WebSockets)
    try:
        user_info = verify_jwt_token(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check if call exists and belongs to user
    call = db.query(Call).filter(Call.id == call_id, Call.user_id == int(user_info.sub)).first()
    if not call:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(call_id, websocket)
    
    transcriber = None
    transcript_buffer = []

    def on_transcript(text: str, is_final: bool):
        if is_final:
            transcript_buffer.append(text)
        
        # Send transcript update back to frontend
        import asyncio
        asyncio.run_coroutine_threadsafe(
            manager.send_json({"type": "transcript", "text": text, "is_final": is_final}, websocket),
            asyncio.get_event_loop()
        )

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "start_transcription":
                if not transcriber:
                    transcriber = transcription_service.create_realtime_transcriber(
                        on_transcript=on_transcript
                    )
                    transcriber.connect()
                await manager.send_json({"type": "status", "message": "Transcription started"}, websocket)
            
            elif message["type"] == "audio":
                if transcriber:
                    # Expecting base64 encoded audio chunk
                    audio_data = base64.b64decode(message["data"])
                    transcriber.stream(audio_data)
            
            elif message["type"] == "stop_transcription":
                if transcriber:
                    transcriber.close()
                    transcriber = None
                
                # Save final transcript to DB
                final_transcript = " ".join(transcript_buffer)
                existing_transcript = db.query(Transcript).filter(Transcript.call_id == call_id).first()
                if existing_transcript:
                    existing_transcript.content = final_transcript
                else:
                    db.add(Transcript(call_id=call_id, content=final_transcript))
                db.commit()
                
                await manager.send_json({"type": "status", "message": "Transcription stopped and saved"}, websocket)

    except WebSocketDisconnect:
        manager.disconnect(call_id)
        if transcriber:
            transcriber.close()
            # Save final transcript on disconnect
            if transcript_buffer:
                final_transcript = " ".join(transcript_buffer)
                existing_transcript = db.query(Transcript).filter(Transcript.call_id == call_id).first()
                if existing_transcript:
                    existing_transcript.content = final_transcript
                else:
                    db.add(Transcript(call_id=call_id, content=final_transcript))
                db.commit()
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(call_id)
        if transcriber:
            transcriber.close()
