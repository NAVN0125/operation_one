"use client";

import { SessionProvider } from "next-auth/react";
import { GlobalNotifications } from "./global-notifications";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
            <GlobalNotifications />
        </SessionProvider>
    );
}
