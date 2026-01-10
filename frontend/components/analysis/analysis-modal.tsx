"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (interpretation: string) => void;
    isLoading?: boolean;
}

export function AnalysisModal({ isOpen, onClose, onSubmit, isLoading }: AnalysisModalProps) {
    const [interpretation, setInterpretation] = useState("");

    const handleSubmit = () => {
        if (interpretation.trim()) {
            onSubmit(interpretation);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Analyze Your Call</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="interpretation">How should we interpret this call?</Label>
                        <Textarea
                            id="interpretation"
                            placeholder="e.g., 'This is a sales call. Focus on objections and buying signals. Identify action items for follow-up.'"
                            value={interpretation}
                            onChange={(e) => setInterpretation(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Provide context to help the AI understand what aspects of the call are most important to you.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!interpretation.trim() || isLoading}>
                        {isLoading ? "Analyzing..." : "Analyze Call"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface AnalysisResultProps {
    result: string;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Call Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {result}
                </div>
            </CardContent>
        </Card>
    );
}
