"use client";

import Link from "next/link";
import { ArrowRight, Phone, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
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
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Operation One
            </span>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-white hover:text-white">
                Log In
              </Button>
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Now with Real-time Analysis
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 animate-in fade-in slide-in-from-bottom-8 duration-700">
              Intelligent Call Analysis <br /> for Modern Teams.
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Transform your VoIP calls with real-time transcription and AI-powered insights.
              Secure, scalable, and built for performance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="https://github.com" target="_blank">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
                  View Source
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full px-4">
            {[
              {
                icon: <Activity className="w-6 h-6 text-blue-400" />,
                title: "Real-time Transcription",
                desc: "Live speech-to-text powered by AssemblyAI for instant call documentation."
              },
              {
                icon: <Shield className="w-6 h-6 text-purple-400" />,
                title: "Secure VoIP",
                desc: "End-to-end encrypted WebSocket streaming for crystal clear audio."
              },
              {
                icon: <Phone className="w-6 h-6 text-green-400" />,
                title: "AI Analysis",
                desc: "Get instant sentiment analysis and action items post-call."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/50 transition-colors text-left animate-in fade-in slide-in-from-bottom-12 duration-700" style={{ animationDelay: `${400 + (i * 100)}ms` }}>
                <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
