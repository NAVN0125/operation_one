"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                            <Phone className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            CallAI
                        </span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </header>

                {/* Login Card */}
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                            <div className="text-center mb-8">
                                <div className="inline-flex p-3 bg-blue-600/20 rounded-2xl mb-4">
                                    <Phone className="w-8 h-8 text-blue-400" />
                                </div>
                                <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                                <p className="text-slate-400">
                                    Sign in to access your call dashboard
                                </p>
                            </div>

                            <Button
                                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                                className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-xl transition-all hover:scale-[1.02] shadow-lg"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>

                            <p className="text-center text-sm text-slate-500 mt-6">
                                By signing in, you agree to our Terms of Service
                            </p>
                        </div>

                        <p className="text-center text-slate-500 text-sm mt-6">
                            Don't have an account?{" "}
                            <button
                                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                            >
                                Sign up for free
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
