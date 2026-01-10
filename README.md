# System Call Analysis Application

A professional-grade web application for real-time VoIP call transcription and interactive AI analysis.

## 🚀 Overview

This system allows users to initiate calls from the browser, stream audio in real-time to a private FastAPI server, receive live transcriptions via AssemblyAI, and perform deep analysis of the conversation using OpenRouter (LLMs).

## ✨ Key Features

- **Google Authentication**: Secure login via Google OAuth 2.0 and JWT session management.
- **Custom VoIP Architecture**: Real-time audio streaming from browser to backend using WebSockets (no external SFU required).
- **Live Transcription**: Conditional real-time transcription powered by **AssemblyAI**, starting only when the call is answered.
- **Local Recording**: Captures and saves call audio directly in the browser using the MediaRecorder API.
- **Interactive AI Analysis**: Post-call analysis using **OpenRouter**, allowing users to provide context (e.g., "focus on sales objections") to guide the AI's interpretation.
- **Persistent Storage**: All call metadata, transcripts, and analysis results are stored in **MySQL**.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Auth**: NextAuth.js
- **Icons**: Lucide Icons

### Backend
- **Framework**: FastAPI (Python 3.9)
- **Database**: MySQL 8 / SQLAlchemy
- **Streaming**: WebSockets for audio ingestion
- **AI Services**: AssemblyAI (Transcription), OpenRouter (Analysis)

---

## 🏃 Getting Started

### Prerequisites

- Node.js 24+
- Python 3.9+
- MySQL 8

### 1. Setup Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Update your API keys
uvicorn app.main:app --reload
```

### 2. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Update your Google Client IDs and NextAuth secret
npm run dev
```

## 📂 Project Structure

- `backend/app/`: Core FastAPI logic, database models, and WebSocket handlers.
- `frontend/app/`: Next.js pages and dashboard.
- `frontend/components/`: Reusable UI and Call-specific components.
- `frontend/hooks/`: Custom state management for calls and audio streaming.

---

## 🔒 Security

- OAuth 2.0 Flow: Frontend manages Google Login -> Backend validates ID Token -> Backend issues JWT.
- Environment variables are separated for Frontend and Backend safety.
- `.gitignore` configured to prevent leaking secrets and large binary files.
