"use client";

import { useState, useCallback, useRef } from "react";

interface UseAudioRecorderReturn {
    isRecording: boolean;
    audioBlob: Blob | null;
    audioUrl: string | null;
    startRecording: (onData?: (base64Data: string) => void) => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async (onData?: (base64Data: string) => void) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);

                    if (onData) {
                        // Convert blob to base64 for WebSocket streaming
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                                const base64 = reader.result.split(",")[1];
                                onData(base64);
                            }
                        };
                        reader.readAsDataURL(event.data);
                    }
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250); // Small interval for real-time streaming
            setIsRecording(true);
        } catch (error) {
            console.error("Failed to start recording:", error);
            throw error;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const clearRecording = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
    }, [audioUrl]);

    return {
        isRecording,
        audioBlob,
        audioUrl,
        startRecording,
        stopRecording,
        clearRecording,
    };
}
