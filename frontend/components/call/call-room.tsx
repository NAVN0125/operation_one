"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CallRoomProps {
    roomName: string;
    status: "connected" | "answered" | "ended";
    onCallEnd: () => void;
    onCallAnswered: () => void;
    onAudioData: (base64Audio: string) => void;
    onTranscriptReceived?: (text: string, isFinal: boolean) => void;
}

export function CallRoom({
    roomName,
    status,
    onCallEnd,
    onCallAnswered,
    onAudioData,
    onTranscriptReceived,
}: CallRoomProps) {
    const [isAnswered, setIsAnswered] = useState(status === "answered");

    useEffect(() => {
        setIsAnswered(status === "answered");
    }, [status]);

    const handleAnswer = useCallback(() => {
        onCallAnswered();
    }, [onCallAnswered]);

    const handleEnd = useCallback(() => {
        onCallEnd();
    }, [onCallEnd]);

    return (
        <Card className="w-full max-w-md mx-auto bg-slate-900/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
                <CardTitle className="text-center text-white">Call Session: {roomName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center animate-pulse ${isAnswered ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
                        }`}>
                        <span className="text-3xl">📞</span>
                    </div>
                    <p className="mt-4 text-slate-300 font-medium">
                        {isAnswered ? "Call Active" : "Waiting for answer..."}
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    {!isAnswered && (
                        <Button
                            onClick={handleAnswer}
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                        >
                            Answer
                        </Button>
                    )}
                    <Button
                        onClick={handleEnd}
                        variant="destructive"
                        className="w-full"
                    >
                        End Call
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
