# ⚡ Jeetvis - AI-Driven Productivity & Task Intelligence Platform

[![CI/CD Pipeline](https://github.com/Avinashb722/Jeetvis/actions/workflows/ci.yml/badge.svg)](https://github.com/Avinashb722/Jeetvis/actions)
[![Powered by Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%202.5-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Jeetvis** is a smart, full-stack workflow automation and task management engine powered by Google Gemini 2.5 Flash (`@google/genai`). Featuring voice command parsing, Drizzle ORM task persistence, and intelligent query processing, Jeetvis delivers an optimized workspace for high-velocity teams.

---

## 🏗 System Architecture

```mermaid
graph TD
    Client([Client App - React + Vite]) -->|HTTPS / JSON| API[Express API Server]
    API -->|CORS & Security| Middleware[Rate Limiting & CORS Middleware]
    Middleware -->|Endpoint Router| Controllers{Jeetvis Services}
    Controllers -->|Voice Command Engine| VoiceModule[Voice Processing Unit]
    Controllers -->|AI Query Route| GeminiSDK[@google/genai SDK]
    Controllers -->|Database Layer| DrizzleORM[Drizzle ORM & Postgres]
    
    GeminiSDK -->|Google API| Gemini25[Gemini 2.5 Flash LLM]
    Gemini25 -->|Natural Response| GeminiSDK
    GeminiSDK -->|Structured JSON| Controllers
    Controllers -->|API Response| Client

    subgraph Fallback & Resilience
        API -.->|Key Missing / Outage| LocalFallback[Smart Fallback Handler]
        LocalFallback -.->|Mock Data Payload| Client
    end
```

---

## ⚡ Key Features

- 🧠 **Gemini 2.5 Flash Integration**: Instant answers and automated task breakdown using `@google/genai`.
- 🎙️ **Voice Command Processing**: Convert spoken transcripts into actionable workflow tasks.
- 📋 **Task Management System**: CRUD endpoints backed by Drizzle ORM structure.
- 🔒 **Enterprise Security**: Built-in rate limiting (`X-RateLimit-*`), CORS headers, and input validation.
- 🛡️ **Resilient Fallback**: Automatic mock fallbacks when API keys are absent or unavailable.
- 🧪 **Vitest Integration Tests**: Pre-packaged test suite validating all endpoint behaviors.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/jeetvis
```

---

## 🚀 Quick Setup & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Avinashb722/Jeetvis.git
   cd Jeetvis
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY into .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server running at `http://localhost:3000`.

---

## 📡 API Reference

### Health Check
- **GET** `/api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "jeetvis-api",
    "timestamp": "2026-08-12T12:00:00Z",
    "version": "1.0.0",
    "geminiConfigured": true
  }
  ```

### Ask Gemini AI Agent
- **POST** `/api/gemini/ask`
- **Body**:
  ```json
  {
    "prompt": "Prioritize my top 3 software architecture tasks for today.",
    "model": "gemini-2.5-flash"
  }
  ```

### Process Voice Command
- **POST** `/api/voice/process`
- **Body**:
  ```json
  {
    "transcript": "Create a new task to update database indexes"
  }
  ```

### Manage Tasks
- **GET** `/api/tasks`
- **POST** `/api/tasks` -> `{ "title": "Implement caching layer" }`

---

## 🧪 Testing Guide

Run the Vitest integration suite:

```bash
# Execute unit & integration tests
npm test

# Run type checker
npm run lint
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
