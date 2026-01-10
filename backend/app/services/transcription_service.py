"""
AssemblyAI Real-time Transcription Service
"""
import assemblyai as aai
from typing import Optional, Callable
from app.core.config import settings


class TranscriptionService:
    """Service for real-time transcription using AssemblyAI."""

    def __init__(self):
        if settings.assemblyai_api_key:
            aai.settings.api_key = settings.assemblyai_api_key

    def create_realtime_transcriber(
        self,
        on_transcript: Callable[[str, bool], None],
        on_error: Optional[Callable[[Exception], None]] = None,
    ) -> aai.RealtimeTranscriber:
        """
        Create a real-time transcriber instance.
        
        Args:
            on_transcript: Callback for transcript updates (text, is_final).
            on_error: Callback for errors.
        
        Returns:
            RealtimeTranscriber instance.
        """
        if not settings.assemblyai_api_key:
            raise ValueError("AssemblyAI API key not configured")

        def handle_transcript(transcript: aai.RealtimeTranscript):
            if transcript.text:
                is_final = isinstance(transcript, aai.RealtimeFinalTranscript)
                on_transcript(transcript.text, is_final)

        def handle_error(error: aai.RealtimeError):
            if on_error:
                on_error(Exception(str(error)))

        transcriber = aai.RealtimeTranscriber(
            sample_rate=16000,
            on_data=handle_transcript,
            on_error=handle_error,
        )

        return transcriber

    async def transcribe_audio_file(self, audio_url: str) -> Optional[str]:
        """
        Transcribe an audio file (post-call).
        
        Args:
            audio_url: URL of the audio file.
        
        Returns:
            Transcription text.
        """
        if not settings.assemblyai_api_key:
            raise ValueError("AssemblyAI API key not configured")

        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_url)

        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")

        return transcript.text


transcription_service = TranscriptionService()
