"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface PresenceUpdate {
    type: "presence_update";
    user_id: number;
    is_online: boolean;
}

interface HeartbeatMessage {
    type: "heartbeat";
}

type PresenceMessage = PresenceUpdate | HeartbeatMessage;

export function usePresence() {
    const { data: session } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        if (!session?.idToken) return;

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(
            `ws://localhost:8000/ws/presence?token=${session.idToken}`
        );

        ws.onopen = () => {
            console.log("Presence WebSocket connected");
            setIsConnected(true);

            // Start heartbeat
            heartbeatIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "heartbeat_response" }));
                }
            }, 30000); // Send heartbeat every 30 seconds
        };

        ws.onmessage = (event) => {
            try {
                const message: PresenceMessage = JSON.parse(event.data);

                if (message.type === "presence_update") {
                    setOnlineUsers((prev) => {
                        const newSet = new Set(prev);
                        if (message.is_online) {
                            newSet.add(message.user_id);
                        } else {
                            newSet.delete(message.user_id);
                        }
                        return newSet;
                    });
                } else if (message.type === "heartbeat") {
                    // Server sent heartbeat, respond
                    ws.send(JSON.stringify({ type: "heartbeat_response" }));
                }
            } catch (error) {
                console.error("Error parsing presence message:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("Presence WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("Presence WebSocket disconnected");
            setIsConnected(false);

            // Clear heartbeat interval
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }

            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log("Attempting to reconnect presence WebSocket...");
                connect();
            }, 3000);
        };

        wsRef.current = ws;
    }, [session?.idToken]);

    useEffect(() => {
        if (session?.idToken) {
            connect();
        }

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.idToken]);

    const isUserOnline = useCallback(
        (userId: number) => {
            return onlineUsers.has(userId);
        },
        [onlineUsers]
    );

    return {
        isConnected,
        onlineUsers,
        isUserOnline,
    };
}
