"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CallRoom } from "@/components/call/call-room";
import { AnalysisModal, AnalysisResult } from "@/components/analysis/analysis-modal";
import { ConnectionList } from "@/components/connections/connection-list";
import { useCall } from "@/hooks/use-call";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { usePresence } from "@/hooks/use-presence";
import { User, Users } from "lucide-react";

interface Connection {
    id: number;
    connected_user_id: number;
    connected_user_name: string | null;
    connected_user_display_name: string | null;
    is_online: boolean;
    created_at: string;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isUserOnline } = usePresence();
    const { callState, transcript, initiateCall, answerCall, endCall, sendAudio, isLoading, error } = useCall();
    const { isRecording, audioUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();

    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    // Check if we should auto-select a user from URL params
    useEffect(() => {
        const callUser = searchParams?.get('callUser');
        if (callUser) {
            setSelectedUserId(parseInt(callUser));
        }
    }, [searchParams]);

    // Fetch connections
    useEffect(() => {
        if (session?.idToken) {
            fetchConnections();
        }
    }, [session]);

    // Update online status in real-time
    useEffect(() => {
        setConnections((prev) =>
            prev.map((conn) => ({
                ...conn,
                is_online: isUserOnline(conn.connected_user_id),
            }))
        );
    }, [isUserOnline]);

    const fetchConnections = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/users/me/connections", {
                headers: {
                    Authorization: `Bearer ${session?.idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setConnections(data);
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const handleStartCall = async (targetUserId: number) => {
        await initiateCall(targetUserId);
    };

    const handleAnswerCall = async () => {
        await answerCall();
        await startRecording(sendAudio);
    };

    const handleEndCall = async () => {
        stopRecording();
        await endCall();
        setShowAnalysisModal(true);
    };

    const handleAnalyze = async (interpretation: string) => {
        setShowAnalysisModal(false);
        setAnalysisResult(`**Analysis based on your interpretation:**\n\n"${interpretation}"\n\n*Note: Connect your AssemblyAI and OpenRouter API keys to enable full analysis.*`);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">System Call Analysis</CardTitle>
                        <CardDescription>Sign in to start analyzing your calls</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => signIn("google")} size="lg">
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Call Dashboard</h1>
                        <p className="text-slate-400">Welcome, {session.user?.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/profile")}>
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/connections")}>
                            <Users className="h-4 w-4 mr-2" />
                            Connections
                        </Button>
                        <Button variant="outline" onClick={() => signOut()}>
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="border-red-500 bg-red-500/10">
                        <CardContent className="pt-4">
                            <p className="text-red-400">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Call Interface */}
                {callState.status === "idle" || callState.status === "ended" ? (
                    selectedUserId ? (
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Ready to Call</CardTitle>
                                <CardDescription className="text-slate-400">
                                    {connections.find(c => c.connected_user_id === selectedUserId)?.connected_user_display_name || "Selected User"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Button onClick={() => handleStartCall(selectedUserId)} disabled={isLoading} size="lg">
                                    {isLoading ? "Starting..." : "Start Call"}
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                                    Cancel
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <ConnectionList
                            connections={connections}
                            onCall={(userId) => setSelectedUserId(userId)}
                            onRemove={async (userId) => {
                                // Remove connection logic
                                try {
                                    await fetch(`http://localhost:8000/api/users/me/connections/${userId}`, {
                                        method: "DELETE",
                                        headers: { Authorization: `Bearer ${session?.idToken}` },
                                    });
                                    fetchConnections();
                                } catch (error) {
                                    console.error("Error removing connection:", error);
                                }
                            }}
                        />
                    )
                ) : (
                    <CallRoom
                        roomName={callState.roomName || "Unknown"}
                        status={callState.status as "connected" | "answered" | "ended"}
                        onCallAnswered={handleAnswerCall}
                        onCallEnd={handleEndCall}
                        onAudioData={sendAudio}
                    />
                )}

                {/* Recording Status */}
                {isRecording && (
                    <Card className="border-red-500 bg-red-500/10">
                        <CardContent className="pt-4 flex items-center gap-2">
                            <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-400">Streaming audio to server...</span>
                        </CardContent>
                    </Card>
                )}

                {/* Audio Playback */}
                {audioUrl && !isRecording && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Call Recording</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <audio src={audioUrl} controls className="w-full" />
                            <Button variant="outline" onClick={clearRecording} className="text-white border-slate-700 hover:bg-slate-800">
                                Clear Recording
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Transcript Display */}
                {transcript && (
                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Live Transcript</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-950/50 p-4 rounded-md border border-slate-800 min-h-[100px]">
                                <p className="whitespace-pre-wrap text-slate-300">{transcript}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Result */}
                {analysisResult && <AnalysisResult result={analysisResult} />}

                {/* Analysis Modal */}
                <AnalysisModal
                    isOpen={showAnalysisModal}
                    onClose={() => setShowAnalysisModal(false)}
                    onSubmit={handleAnalyze}
                />
            </div>
        </div>
    );
}
