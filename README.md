# JeetVis Personal AI Command & Voice Dashboard

![React 19](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-latest-blue)
![Vite](https://img.shields.io/badge/Vite-latest-purple)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![Firebase Admin](https://img.shields.io/badge/Firebase_Admin-latest-orange)
![Google APIs](https://img.shields.io/badge/Google_APIs-latest-blue)
![Gemini 2.0](https://img.shields.io/badge/Gemini-2.0-yellow)

## Summary
JeetVis Personal AI Command & Voice Dashboard — unified AI workspace integrating Google Calendar/Gmail APIs, Drizzle ORM persistence, and voice control.

## Core Features
*   **Google APIs Integration:** Seamlessly connect with Calendar, Gmail, and other Google services.
*   **Drizzle ORM Relational Database Sync:** Robust and type-safe database operations.
*   **Voice Query Processor:** Control your dashboard using natural language voice commands.
*   **Firebase Admin Dashboard:** Powerful administration and management interface.
*   **Task Management:** Organize and track your daily activities efficiently.

## Setup Guide
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure Google OAuth & Firebase credentials in your `.env` file.
3. Start the development server:
   ```bash
   npm run dev
   ```
API Docs added
## API Documentation
- GET /api/health: Check server status.
- POST /api/voice/process: Process voice transcript.
- GET /api/tasks: Get user tasks.
- POST /api/tasks: Create new task.
- POST /api/ai/query: AI queries using Gemini.
