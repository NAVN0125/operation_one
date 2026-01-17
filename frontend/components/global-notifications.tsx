"use client";

import { useEffect } from "react";
import { usePresence } from "@/hooks/use-presence";
import { UserPlus } from "lucide-react";

export function GlobalNotifications() {
    const { newConnection, clearNewConnection } = usePresence();

    useEffect(() => {
        if (newConnection) {
            // In a real app, we'd use a toast library. 
            // For now, we'll use a simple alert or a custom overlay.
            const name = newConnection.user.display_name || newConnection.user.name;

            // Auto-clear after 5 seconds
            const timer = setTimeout(() => {
                clearNewConnection();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [newConnection, clearNewConnection]);

    if (!newConnection) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/50 rounded-xl p-4 shadow-2xl shadow-blue-500/10 flex items-center gap-4 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-semibold">New Connection!</h4>
                    <p className="text-slate-400 text-sm">
                        <span className="text-blue-400 font-medium">{newConnection.user.display_name || newConnection.user.name}</span> added you as a connection.
                    </p>
                </div>
                <button
                    onClick={clearNewConnection}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
