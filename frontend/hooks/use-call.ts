"use client";

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

interface CallState {
    callId: number | null;
    roomName: string | null;
    status: "idle" | "initiating" | "connected" | "answered" | "ended";
}

interface UseCallReturn {
    callState: CallState;
    transcript: string;
    initiateCall: (targetUserId: number, roomName?: string) => Promise<void>;
    answerCall: () => Promise<void>;
    endCall: () => Promise<void>;
    sendAudio: (base64Audio: string) => void;
    isLoading: boolean;
    error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("http", "ws");

export function useCall(): UseCallReturn {
    const { data: session } = useSession();
    const [callState, setCallState] = useState<CallState>({
        callId: null,
        roomName: null,
        status: "idle",
    });
    const [transcript, setTranscript] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    const getBackendToken = useCallback(async (): Promise<string | null> => {
        if (!session?.idToken) return null;

        const response = await fetch(`${API_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: session.idToken }),
        });

        if (!response.ok) {
            throw new Error("Failed to authenticate with backend");
        }

        const data = await response.json();
        return data.access_token;
    }, [session]);

    const initiateCall = useCallback(
        async (targetUserId: number, roomName?: string) => {
            setIsLoading(true);
            setError(null);
            setTranscript("");

            try {
                const backendToken = await getBackendToken();
                if (!backendToken) {
                    throw new Error("Not authenticated");
                }

                const response = await fetch(`${API_URL}/api/calls/initiate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${backendToken}`,
                    },
                    body: JSON.stringify({ target_user_id: targetUserId, room_name: roomName }),
                });

                if (!response.ok) {
                    throw new Error("Failed to initiate call");
                }

                const data = await response.json();

                // Connect WebSocket
                const socket = new WebSocket(`${WS_URL}/ws/call/${data.call_id}?token=${backendToken}`);

                socket.onopen = () => {
                    setCallState({
                        callId: data.call_id,
                        roomName: data.room_name,
                        status: "connected",
                    });
                    wsRef.current = socket;
                };

                socket.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    if (message.type === "transcript") {
                        if (message.is_final) {
                            setTranscript((prev) => prev + " " + message.text);
                        } else {
                            // For real-time display, we might want a separate "current line" state
                            // but for now let's just append final ones or handle this simplified
                        }
                    }
                };

                socket.onerror = (err) => {
                    console.error("WebSocket error:", err);
                    setError("WebSocket connection failed");
                };

                socket.onclose = () => {
                    setCallState((prev) => ({ ...prev, status: "ended" }));
                    wsRef.current = null;
                };

            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        },
        [getBackendToken]
    );

    const answerCall = useCallback(async () => {
        if (!callState.callId || !wsRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const backendToken = await getBackendToken();
            if (!backendToken) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(
                `${API_URL}/api/calls/${callState.callId}/answer`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${backendToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to answer call");
            }

            // Signal start to backend
            wsRef.current.send(JSON.stringify({ type: "start_transcription" }));

            setCallState((prev) => ({ ...prev, status: "answered" }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [callState.callId, getBackendToken]);

    const endCall = useCallback(async () => {
        if (!callState.callId) return;

        setIsLoading(true);
        setError(null);

        try {
            const backendToken = await getBackendToken();
            if (!backendToken) {
                throw new Error("Not authenticated");
            }

            if (wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: "stop_transcription" }));
                wsRef.current.close();
            }

            const response = await fetch(
                `${API_URL}/api/calls/${callState.callId}/end`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${backendToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to end call");
            }

            setCallState({
                callId: callState.callId,
                roomName: null,
                status: "ended",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [callState.callId, getBackendToken]);

    const sendAudio = useCallback((base64Audio: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "audio", data: base64Audio }));
        }
    }, []);

    return {
        callState,
        transcript,
        initiateCall,
        answerCall,
        endCall,
        sendAudio,
        isLoading,
        error,
    };
}
