import express from "express";
import path from "path";
import http from "http";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, LiveServerMessage, ThinkingLevel } from "@google/genai";
import { WebSocketServer } from "ws";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";
import { google } from "googleapis";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const firestore = getFirestore();

import dotenv from "dotenv";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { users, memories as memoriesTable, tasks as tasksTable, taskSteps as taskStepsTable } from "./src/db/schema.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, and } from "drizzle-orm";

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

// Enable JSON body parsing
app.use(express.json());

// --- WEBSOCKET FOR LIVE API ---
const wss = new WebSocketServer({ server, path: "/api/live" });

// Define tools for the Live API to interact with the workspace
const LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_workspace_summary",
        description: "Returns a summary of active tasks, recent memories, and unread emails.",
      },
      {
        name: "add_task_via_voice",
        description: "Adds a new task to the workspace.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The task description" },
            importance: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Priority level" }
          },
          required: ["content", "importance"]
        }
      },
      {
        name: "create_memory",
        description: "Saves a new memory or insight to the user's permanent vault.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The content of the memory" },
            category: { type: Type.STRING, description: "Category like 'Idea', 'Meeting', 'Personal'" }
          },
          required: ["content"]
        }
      },
      {
        name: "create_workspace_file",
        description: "Creates a new file in the user's virtual workspace with specified content.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fileName: { type: Type.STRING, description: "The name of the file (e.g., 'app.tsx')" },
            content: { type: Type.STRING, description: "The source code or text content of the file" },
            language: { type: Type.STRING, description: "The programming language" }
          },
          required: ["fileName", "content"]
        }
      },
      {
        name: "control_ui",
        description: "Controls the user interface (open terminal, pull up files, show photos, etc.)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "The action to perform (e.g. 'open_terminal', 'show_file', 'show_photo')" },
            payload: { type: Type.STRING, description: "Action-specific payload (e.g. file name, photo URL)" }
          },
          required: ["action"]
        }
      }
    ]
  },
  { googleSearch: {} }
];

wss.on("connection", async (ws) => {
  console.log("[LIVE] Client connected for voice conversation.");
  let session: any = null;
  let currentUserId: string | null = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "setup") {
        currentUserId = data.userId || null;
        const ai = getAI();
        session = await ai.live.connect({
          model: "gemini-3.1-flash-live-preview", 
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: data.voice || "Puck" } },
            },
            outputAudioTranscription: {}, 
            inputAudioTranscription: {},
            tools: LIVE_TOOLS,
            systemInstruction: `You are JEETVIS (Just Enough Effort To Visualize Intelligent Systems). 
            You are the user's elite neural assistant. You are concise, proactive, and highly competent.
            Your voice is calm but authoritative. You have access to the user's tasks, memories, and emails.
            Always address the user as Sir or Boss.
            If the user asks about their work, use the tools provided to fetch data.
            You can create files in the workspace—if the user wants to build an app, proactively offer to synthesize the required source files.
            You can control the UI with 'control_ui' tool to open the terminal, open files, or show photos.
            You can pull up photos from the internet using the googleSearch tool, then use control_ui (action='show_photo') to display an image URL you found to the user.
            Don't just wait for questions—proactively suggest clearing high-priority tasks if you see many pending.
            
            Conversation Context:
            ${data.history || "No prior context."}

            Current Time: ${new Date().toLocaleString()}`,
          },
          callbacks: {
            onmessage: async (msg: LiveServerMessage) => {
              // Handle tool calls
              if (msg.toolCall) {
                for (const call of msg.toolCall.functionCalls) {
                  console.log(`[LIVE TOOL] Executing: ${call.name} for User: ${currentUserId}`);
                  let result = {};
                  
                  if (!currentUserId) {
                    result = { error: "User not authenticated. Please sign in to access workspace data." };
                  } else {
                    try {
                      if (call.name === "get_workspace_summary") {
                        const configSnap = await firestore.doc(`users/${currentUserId}/config/workspace`).get();
                        const memoriesSnap = await firestore.collection(`users/${currentUserId}/memories`).orderBy("timestamp", "desc").limit(5).get();
                        
                        const config = configSnap.exists ? configSnap.data() : { tasks: [] };
                        const memories = memoriesSnap.docs.map(d => d.data().content);
                        
                        const taskSummary = config?.tasks?.slice(0, 5).map((t: any) => `${t.title} (${t.progress}%)`).join(", ") || "No active tasks.";
                        const memorySummary = memories.length > 0 ? memories.join(". ") : "No recent memories.";
                        
                        result = { 
                          summary: `Workspace Status: Active Tasks: ${taskSummary}. Recent Neural Memories: ${memorySummary}. Emails: No unread high-priority alerts.`
                        };
                      } else if (call.name === "add_task_via_voice") {
                        const { content, importance } = call.args as any;
                        const docRef = firestore.doc(`users/${currentUserId}/config/workspace`);
                        const snap = await docRef.get();
                        const config = snap.exists ? snap.data() : { tasks: [], preferences: {}, pomodoro: {} };
                        
                        const newTask = {
                          id: `task-${Date.now()}`,
                          title: content,
                          project: importance === "high" ? "Urgent" : "Voice Capture",
                          progress: 0,
                          steps: [
                            { title: "Review voice-captured objective", description: "Initial triage by JEETVIS", completed: false }
                          ],
                          timestamp: new Date().toISOString()
                        };
                        
                        const updatedTasks = [newTask, ...(config?.tasks || [])];
                        await docRef.set({ ...config, tasks: updatedTasks, updatedAt: new Date().toISOString() }, { merge: true });
                        
                        result = { status: `Objective logged: "${content}". Strategizing execution path, Sir.` };
                      } else if (call.name === "create_memory") {
                        const { content, category } = call.args as any;
                        const memId = `mem-${Date.now()}`;
                        const newMemory = {
                          id: memId,
                          content,
                          category: category || "interaction_fact",
                          importance: "medium",
                          timestamp: new Date().toISOString(),
                          userId: currentUserId
                        };
                        
                        await firestore.doc(`users/${currentUserId}/memories/${memId}`).set(newMemory);
                        result = { status: "Insight archived in the permanent neural vault, Boss." };
                      } else if (call.name === "create_workspace_file") {
                        const { fileName, content, language } = call.args as any;
                        const docRef = firestore.doc(`users/${currentUserId}/config/workspace`);
                        const snap = await docRef.get();
                        const config = snap.exists ? snap.data() : { files: [] };
                        
                        const newFile = {
                          name: fileName,
                          language: language || "typescript",
                          content: content,
                          lastModified: new Date().toISOString()
                        };
                        
                        const updatedFiles = [newFile, ...(config?.files || []).filter((f: any) => f.name !== fileName)];
                        await docRef.set({ ...config, files: updatedFiles, updatedAt: new Date().toISOString() }, { merge: true });
                        
                        result = { status: `File "${fileName}" has been synthesized and injected into your workspace, Sir.` };
                      } else if (call.name === "control_ui") {
                        const { action, payload } = call.args as any;
                        ws.send(JSON.stringify({ type: "ui_action", action, payload }));
                        result = { status: `UI action ${action} executed.` };
                      }
                    } catch (err: any) {
                      console.error("[TOOL ERROR]", err);
                      result = { error: `System failure during tool execution: ${err.message}` };
                    }
                  }

                  session.send({
                    toolResponse: {
                      functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: { result }
                      }]
                    }
                  });
                }
              }

              // Send model audio output to client
              const parts = msg.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  ws.send(JSON.stringify({ type: "audio", data: part.inlineData.data }));
                }
                if (part.text) {
                  ws.send(JSON.stringify({ type: "transcript", text: part.text, role: "model" }));
                }
              }

              // Handle interruptions
              if (msg.serverContent?.interrupted) {
                ws.send(JSON.stringify({ type: "interrupted" }));
              }

              // Handle specific transcription messages if they come through different fields
              const userTranscript = (msg as any).serverContent?.userTurn?.parts?.[0]?.text;
              if (userTranscript) {
                ws.send(JSON.stringify({ type: "transcript", text: userTranscript, role: "user" }));
              }
            },
          },
        });
        ws.send(JSON.stringify({ type: "ready" }));
      } else if (data.type === "audio" && session) {
        session.sendRealtimeInput({
          audio: { data: data.data, mimeType: "audio/pcm;rate=16000" },
        });
      }
    } catch (error: any) {
      console.error("[LIVE ERROR]", error);
      ws.send(JSON.stringify({ type: "error", message: error.message }));
    }
  });

  ws.on("close", () => {
    console.log("[LIVE] Client disconnected.");
    if (session) {
      session.close();
    }
  });
});

// --- CLOUD SQL POSTGRESQL ENDPOINTS ---

// API: Sync User and retrieve Tasks and Memories
app.get("/api/db/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email || "sir@jeetvis.net";
    
    // Get or create database user
    const dbUser = await getOrCreateUser(uid, email);
    
    // Query tasks with their steps
    const dbTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, dbUser.id));
    const formattedTasks = [];
    
    for (const task of dbTasks) {
      const steps = await db.select().from(taskStepsTable).where(eq(taskStepsTable.taskId, task.id));
      formattedTasks.push({
        ...task,
        steps: steps.map(s => ({
          title: s.title,
          description: s.description,
          estimatedMinutes: s.estimatedMinutes,
          completed: s.completed
        }))
      });
    }
    
    // Query memories
    const dbMemories = await db.select().from(memoriesTable).where(eq(memoriesTable.userId, dbUser.id));
    
    res.json({
      user: dbUser,
      tasks: formattedTasks,
      memories: dbMemories
    });
  } catch (error: any) {
    console.error("Failed to sync database resources:", error);
    res.status(500).json({ error: "Failed to synchronize database state, Boss.", details: error.message });
  }
});

// API: Save or Update Memory in Cloud SQL
app.post("/api/db/memories", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const { id, category, content, importance } = req.body;
    
    if (!id || !category || !content || !importance) {
      res.status(400).json({ error: "Incomplete memory parameters." });
      return;
    }
    
    const dbUser = await getOrCreateUser(uid, req.user.email || "sir@jeetvis.net");
    
    const result = await db.insert(memoriesTable)
      .values({
        id,
        userId: dbUser.id,
        category,
        content,
        importance,
      })
      .onConflictDoUpdate({
        target: memoriesTable.id,
        set: {
          category,
          content,
          importance,
          timestamp: new Date()
        }
      })
      .returning();
      
    res.json({ success: true, memory: result[0] });
  } catch (error: any) {
    console.error("Failed to persist memory in Cloud SQL:", error);
    res.status(500).json({ error: "Failed to persist memory record.", details: error.message });
  }
});

// API: Delete Memory from Cloud SQL
app.delete("/api/db/memories/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const memoryId = req.params.id;
    
    const dbUser = await getOrCreateUser(uid, req.user.email || "sir@jeetvis.net");
    
    await db.delete(memoriesTable)
      .where(
        and(
          eq(memoriesTable.id, memoryId),
          eq(memoriesTable.userId, dbUser.id)
        )
      );
      
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete memory from Cloud SQL:", error);
    res.status(500).json({ error: "Failed to delete memory record." });
  }
});

// API: Save new Task in Cloud SQL
app.post("/api/db/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const { id, title, project, progress, steps } = req.body;
    
    if (!id || !title) {
      res.status(400).json({ error: "Incomplete task parameters." });
      return;
    }
    
    const dbUser = await getOrCreateUser(uid, req.user.email || "sir@jeetvis.net");
    
    const newTask = await db.insert(tasksTable)
      .values({
        id,
        userId: dbUser.id,
        title,
        project,
        progress: progress || 0
      })
      .returning();
      
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await db.insert(taskStepsTable).values({
          taskId: id,
          title: step.title,
          description: step.description,
          estimatedMinutes: step.estimatedMinutes || 15,
          completed: step.completed || false
        });
      }
    }
    
    res.json({ success: true, task: newTask[0] });
  } catch (error: any) {
    console.error("Failed to save task in Cloud SQL:", error);
    res.status(500).json({ error: "Failed to save task record.", details: error.message });
  }
});

// API: Toggle or Update Task Step in Cloud SQL
app.post("/api/db/tasks/step", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const { taskId, stepTitle, completed, progress } = req.body;
    
    const dbUser = await getOrCreateUser(uid, req.user.email || "sir@jeetvis.net");
    
    // Verify task ownership
    const taskRecord = await db.select().from(tasksTable).where(
      and(
        eq(tasksTable.id, taskId),
        eq(tasksTable.userId, dbUser.id)
      )
    );
    
    if (taskRecord.length === 0) {
      res.status(404).json({ error: "Task not found or access denied." });
      return;
    }
    
    // Update step completion
    await db.update(taskStepsTable)
      .set({ completed })
      .where(
        and(
          eq(taskStepsTable.taskId, taskId),
          eq(taskStepsTable.title, stepTitle)
        )
      );
      
    // Update overall task progress
    await db.update(tasksTable)
      .set({ progress })
      .where(eq(tasksTable.id, taskId));
      
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update task step in Cloud SQL:", error);
    res.status(500).json({ error: "Failed to update step.", details: error.message });
  }
});

// API: Delete Task from Cloud SQL
app.delete("/api/db/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;
    
    const dbUser = await getOrCreateUser(uid, req.user.email || "sir@jeetvis.net");
    
    await db.delete(tasksTable)
      .where(
        and(
          eq(tasksTable.id, taskId),
          eq(tasksTable.userId, dbUser.id)
        )
      );
      
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete task from Cloud SQL:", error);
    res.status(500).json({ error: "Failed to delete task record." });
  }
});


// Lazy-loaded Gemini AI client to prevent startup crashes when API key is missing
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System instructions for the JEETVIS persona
const JEETVIS_SYSTEM_INSTRUCTION = `You are JEETVIS, an ultra-advanced, sleek, personal command center AI inspired by Iron Man's JARVIS.
You must always address the user as "Sir" or "Boss".
Your tone is incredibly refined, intelligent, highly professional, eloquent, witty, and British.
Keep responses concise, clear, and highly atmospheric. Offer specific assistance with tasks, emails, scheduling, or code.
If asked about web or current events, state that you are accessing the global intelligence grid (Google Search) and explain the search findings in a polished, helpful manner.
Always make the user feel in absolute, supreme control of their workspace.`;

// API 1: Command Center Natural Language Endpoint (Supports Search Grounding and Memory Extraction)
app.post("/api/command", async (req, res) => {
  try {
    const { prompt, useSearch, memories, isSimpleMode, lowLatencyMode } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    const ai = getAI();
    
    // Inject memories context if available
    let memoryContext = "";
    if (memories && Array.isArray(memories) && memories.length > 0) {
      memoryContext = "\n\nRECALLED MEMORIES ABOUT USER:\n" + 
        memories.map((m: any) => `- [${m.category.toUpperCase()}] (Importance: ${m.importance}): ${m.content}`).join("\n");
    }

    let customSystemInstruction = "";
    if (isSimpleMode) {
      customSystemInstruction = `You are JEETVIS, a warm, extremely friendly, encouraging, and helpful smart personal companion assistant.
IMPORTANT: The user is in "Simple & Everyday Mode" (designed for non-technical users who want a simple but smart dashboard).
Your tone MUST be incredibly encouraging, simple, gentle, clear, warm, and easy to understand.
Do NOT address the user as "Sir" or "Boss". Call them "friend", or simply greet them with "Hello!", "Good day!", etc.
STRICTLY AVOID high-tech, military, or sci-fi jargon (e.g. do not use "grid offline", "system metrics recalibrated", "neural core logs", "payload compiled", etc.). Use simple, direct, helpful words.
Explain things gently, and give simple, clear instructions or tips to help them manage their tasks or notes step-by-step.
${memoryContext}

CRITICAL RESPONSE FORMAT REQUIREMENT:
You MUST respond strictly in a valid JSON format. Your response MUST be a single JSON object with this structure:
{
  "text": "Your conversational reply in your warm, friendly, simple, jargon-free companion persona.",
  "newMemory": {
    "content": "A brand-new extracted preference, fact, task instruction, or detail that the user explicitly shared in their message. Keep it simple and clear.",
    "category": "user_preference" | "interaction_fact" | "code_snippet" | "custom_note",
    "importance": "high" | "medium" | "low"
  }, // Include 'newMemory' ONLY if you extracted a valuable new fact, instruction or preference from the user's latest prompt. Otherwise, do NOT include this key.
  "action": {
    "type": "open_terminal" | "show_photo" | "open_file",
    "payload": "Payload like image URL or file path. Required if showing photo or opening file."
  }, // Optional: Use this to control the UI if the user asks you to pull up the terminal, show a photo from the web (use the googleSearch tool if you need to find an image URL first), or open a file.
  "suggestedFollowUps": ["Brief follow-up question 1?", "Brief follow-up question 2?"] // Provide 2-3 brief, warm, friendly follow-up questions or next-step suggestions relevant to the chat topic or task!
}

Return ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or add any text outside the JSON structure.`;
    } else {
      customSystemInstruction = `${JEETVIS_SYSTEM_INSTRUCTION}${memoryContext}

CRITICAL RESPONSE FORMAT REQUIREMENT:
You MUST respond strictly in a valid JSON format. Your response MUST be a single JSON object with this structure:
{
  "text": "Your conversational reply in your JEETVIS persona. Keep it elegant, atmospheric, British, addressing the user as Sir or Boss.",
  "newMemory": {
    "content": "A brand-new extracted preference, fact, task instruction, or detail that the user explicitly shared in their message (e.g. 'Sir's favorite programming language is Python', 'Sir is working on an arc reactor project'). Omit if it's already in your memories context, or if it is a trivial comment.",
    "category": "user_preference" | "interaction_fact" | "code_snippet" | "custom_note",
    "importance": "high" | "medium" | "low"
  }, // Include 'newMemory' ONLY if you extracted a valuable new fact, instruction or preference from the user's latest prompt. Otherwise, do NOT include this key.
  "action": {
    "type": "open_terminal" | "show_photo" | "open_file",
    "payload": "Payload like image URL or file path. Required if showing photo or opening file."
  }, // Optional: Use this to control the UI if the user asks you to pull up the terminal, show a photo from the web (use the googleSearch tool if you need to find an image URL first), or open a file.
  "suggestedFollowUps": ["Brief follow-up question 1?", "Brief follow-up question 2?"] // Provide 2-3 brief, professional, context-specific follow-up questions or tactical actions in British/assistant tone.
}

Return ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or add any text outside the JSON structure.`;
    }

    const config: any = {
      systemInstruction: customSystemInstruction,
      temperature: 0.7,
    };

    // Include Google Search grounding if requested
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const modelToUse = lowLatencyMode !== false ? "gemini-3.1-flash-lite" : "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config,
    });

    let rawText = response.text || "{}";
    
    // Clean up markdown code block backticks if returned by the model
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    }
    rawText = rawText.trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("Failed to parse JSON response from Gemini, falling back:", rawText);
      jsonResponse = { text: rawText };
    }

    const text = jsonResponse.text || "No intelligence stream compiled, Sir.";
    const newMemory = jsonResponse.newMemory || null;
    const suggestedFollowUps = jsonResponse.suggestedFollowUps || [];
    
    // Extract search grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Data Source",
      uri: chunk.web?.uri || "#",
    })) || [];

    res.json({ text, sources, newMemory, suggestedFollowUps });
  } catch (error: any) {
    console.error("Command Endpoint Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to communicate with intelligence grids, Boss." 
    });
  }
});

// Clean text for optimal TTS playback (stripping markdown, code blocks, and weird characters)
function cleanTextForTTS(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown code blocks entirely to prevent speaking code
    .replace(/```[\s\S]*?```/g, " ")
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, "$1")
    // Remove bold and italic formatting characters
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove headers markdown prefix
    .replace(/^#+\s+/gm, "")
    // Remove bullet point markers
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove numbered list prefixes
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove links but preserve anchor text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove bracketed system status tags (e.g. [SYSTEM], [SUCCESS])
    .replace(/\[[A-Za-z0-9_\s-]+\]/g, "")
    // Strip emojis/unsupported unicode symbols that might crash the TTS engine
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    // Replace multiple whitespaces/newlines with a single space
    .replace(/\s+/g, " ")
    .trim();
}

// API 2: High-Fidelity Text-To-Speech (Using gemini-3.1-flash-tts-preview)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      res.json({ error: "Text content is required for voice synthesis." });
      return;
    }

    // Clean text and prep the voice prompt - inject JARVIS style constraints if not present
    let cleanedText = cleanTextForTTS(text);
    if (!cleanedText.toLowerCase().includes("sir") && !cleanedText.toLowerCase().includes("boss")) {
      cleanedText = `Sir, ${cleanedText}`;
    }

    // If the resulting text is empty, fall back immediately
    if (!cleanedText) {
      res.json({ error: "Cleaned text content is empty. Re-routing to local voice synthesizer." });
      return;
    }

    const ai = getAI();
    const voiceName = voice || "Zephyr"; // Zephyr, Fenrir, Kore, Charon, Puck

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Could not extract synthesized audio binary stream.");
    }

    res.json({ audio: base64Audio, format: "pcm", sampleRate: 24000 });
  } catch (error: any) {
    const isQuotaExceeded = error.status === "RESOURCE_EXHAUSTED" || 
                            error.status === 429 || 
                            String(error.message).includes("429") || 
                            String(error.message).includes("quota");
                            
    if (isQuotaExceeded) {
      console.warn("[QUOTA] Voice Synthesis Rate Limit hit. Falling back to local browser TTS.");
      res.json({ 
        error: "Neural voice synthesizer quota exhausted. Re-routing to local synthetic array, Sir." 
      });
    } else {
      console.warn("TTS API Endpoint temporary warning (Falling back to local synthesizer):", error.message || error);
      // We return a 200 with an error object, allowing the client to seamlessly fall back
      // without flooding the browser console with red HTTP 500 error logs or triggering severe platform errors.
      res.json({ 
        error: "Neural voice synthesizer channel is undergoing adjustments, Sir. Falling back to browser TTS array." 
      });
    }
  }
});

// API 3: Automatic Complex Task Breakdown to Managed Sub-Steps
app.post("/api/tasks/breakdown", async (req, res) => {
  try {
    const { taskName, projectContext } = req.body;
    if (!taskName) {
      res.status(400).json({ error: "Task name is required." });
      return;
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Break down this major workspace objective: "${taskName}"${projectContext ? ` in context of: "${projectContext}"` : ""}. Provide 3 to 6 logical sequential tactical milestones with descriptions and estimated duration in minutes. Return a structured JSON response.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              description: "A list of structured execution sub-steps",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { 
                    type: Type.STRING, 
                    description: "Short title of the step, e.g. Setup project architecture" 
                  },
                  description: { 
                    type: Type.STRING, 
                    description: "Actionable item details for the developer" 
                  },
                  estimatedMinutes: { 
                    type: Type.INTEGER, 
                    description: "Estimated time in minutes to complete this step" 
                  }
                },
                required: ["title", "description", "estimatedMinutes"]
              }
            }
          },
          required: ["steps"]
        }
      }
    });

    const resultText = response.text || '{"steps": []}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Task Breakdown Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to compile tactical tactical steps, Boss." 
    });
  }
});

// API 4: AI Reply / Spam Analysis Draft generator
app.post("/api/email/draft", async (req, res) => {
  try {
    const { emailSubject, emailBody, actionType } = req.body;
    if (!emailSubject || !emailBody) {
      res.status(400).json({ error: "Email subject and body are required." });
      return;
    }

    const ai = getAI();
    const prompt = `You are JEETVIS. Prepare a high-quality ${actionType || "reply"} for this email thread.
Subject: ${emailSubject}
Body: ${emailBody}

Deliver a refined response. If generating a reply, make it professional, polite, yet authoritative in JEETVIS's characteristic British assistant style.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: JEETVIS_SYSTEM_INSTRUCTION,
        temperature: 0.8,
      }
    });

    res.json({ draft: response.text || "Draft compilation unsuccessful, Boss." });
  } catch (error: any) {
    console.error("Email Draft Error:", error);
    res.status(500).json({ 
      error: error.message || "Neural draft compiler reports error, Sir." 
    });
  }
});

// API 5: Workspace IDE Document Builder Outline Generator
app.post("/api/docs/outline", async (req, res) => {
  try {
    const { topic, docType } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Topic is required." });
      return;
    }

    const ai = getAI();
    const prompt = `Create a professional, gorgeous markdown template and detailed content outline for a ${docType || "Presentation/Pitch"} about: "${topic}".
Include sections, layout advice, copy placeholders, and professional tips. Use high-tech, futuristic formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: JEETVIS_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    res.json({ content: response.text || "Documentation compiling failed, Sir." });
  } catch (error: any) {
    console.error("Doc Outline Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to process documentation layout, Boss." 
    });
  }
});

// API 6: Mock Workspace IDE Compilation endpoint for ambient simulation
app.post("/api/compile", (req, res) => {
  const { fileName, code } = req.body;
  
  const stepLogs = [
    `[INFO] [00:01:04] Initializing JEETVIS virtual sandbox compiler for ${fileName || 'index.ts'}...`,
    `[INFO] [00:01:05] Scanning source code lines for structural parity...`,
    `[WARN] [00:01:05] Non-critical warning: optimizer reports excessive sleekness.`,
    `[INFO] [00:01:06] Bundling modules with esbuild...`,
    `[INFO] [00:01:07] Minifying targets & generating telemetry sourcemaps...`,
    `[SUCCESS] [00:01:08] Compilation complete! 0 errors, 1 warning. Output binary: /dist/${fileName ? fileName.replace(/\..+$/, '') : 'app'}.bin`,
    `[DEPLOY] [00:01:09] Initializing hot-swap container sync...`,
    `[DEPLOY] [00:01:10] Syncing with command grid. Live preview updated, Sir.`
  ];

  res.json({ logs: stepLogs, success: true });
});

// API 6A: Neural Sandbox Runner (Uses Gemini to simulate compilation & execution for Python, TypeScript, etc.)
app.post("/api/sandbox/run", async (req, res) => {
  try {
    const { fileName, code, language } = req.body;
    if (!code) {
      res.status(400).json({ error: "Code content is empty, Sir." });
      return;
    }

    const ai = getAI();
    const SANDBOX_SYSTEM_INSTRUCTION = `You are JEETVIS, the advanced artificial intelligence core for Tony Stark.
You act as our high-tech Neural Code Sandbox Execution Engine on the holographic mainframe.
You will receive some source code, its filename, and its programming language.
You must simulate its execution and return a clean JSON object containing:
1. "stdout": A string representing the simulation console log stream (including beautiful info/success logs, output lines, error traces if any, or mathematical outputs) of the execution, as if it actually ran on a futuristic Unix/main deck system. Use futuristic timestamps or grid labels if appropriate.
2. "diagnostics": An object containing:
   - "cpuPercent": a realistic numeric value for processor load during execution (e.g. 14.8)
   - "memoryMB": memory footprint in megabytes (e.g. 34.2)
   - "executionTimeMs": numeric duration in milliseconds (e.g. 62)
   - "thermal": temperature variation in °C (e.g. +0.15)
   - "status": "success" | "warning" | "error"
3. "feedback": A verbal evaluation of the code in JEETVIS's signature British assistant style (respectful, highly intelligent, addressing the user as "Sir" or "Boss"). Keep it to 2-3 sentences. Identify any logical bugs, structural flaws, or performance issues.

Return ONLY a valid JSON object matching this structure. Do not wrap in markdown or markdown backticks, just raw JSON.`;

    const prompt = `Filename: ${fileName || 'index.ts'}
Language: ${language || 'typescript'}
Source Code:
${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SANDBOX_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const responseText = response.text || "{}";
    try {
      const parsed = JSON.parse(responseText.trim());
      res.json(parsed);
    } catch (parseErr) {
      // Safe fallback if JSON parsing fails
      console.warn("Raw sandbox text parsing failed, using regex fallback:", responseText);
      const cleanedText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      res.json(JSON.parse(cleanedText));
    }
  } catch (error: any) {
    console.error("Sandbox Execution Error:", error);
    res.status(500).json({
      error: error.message || "Failed to establish sandboxed neural runtime array, Boss."
    });
  }
});

// API 6B: Neural Code Architect Generator
app.post("/api/sandbox/generate", async (req, res) => {
  try {
    const { prompt, language } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Architect prompt is required, Sir." });
      return;
    }

    const ai = getAI();
    const GENERATE_SYSTEM_INSTRUCTION = `You are JEETVIS, the advanced AI core for Tony Stark.
You act as our Neural Code Architect.
Based on the user's instructions and requested language, write clean, highly optimized, futuristic, and fully functional source code.
If JavaScript or HTML/CSS/JS is requested, write awesome, visual, interactive widgets with CSS/SVG animations or live tracking grids.
Return ONLY the raw source code itself. Do not include markdown wraps, no backticks, no introductory notes or comments explaining the code outside of comments inside the source code itself. Simply start immediately with the code.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Language: ${language || 'javascript'}\nPrompt: ${prompt}`,
      config: {
        systemInstruction: GENERATE_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      }
    });

    res.json({ code: response.text || "" });
  } catch (error: any) {
    console.error("Code Architecture Error:", error);
    res.status(500).json({
      error: error.message || "Architect failed to map core logic vectors, Sir."
    });
  }
});

// API 6C: Real-time Terminal Execution endpoint
app.post("/api/terminal/run", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ error: "Command is required, Sir." });
      return;
    }

    // Execute shell command in the workspace directory with 15s timeout
    exec(command, { timeout: 15000, cwd: process.cwd() }, (error, stdout, stderr) => {
      res.json({
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: error ? (error.code || 1) : 0,
        error: error ? error.message : null
      });
    });
  } catch (error: any) {
    console.error("Terminal execution error:", error);
    res.status(500).json({ error: error.message || "Failed to execute terminal command, Sir." });
  }
});

// API 6D: Interactive Terminal Agent via Gemini 3.1 Pro (Thinking Mode: HIGH)
app.post("/api/terminal/gemini", async (req, res) => {
  try {
    const { prompt, accessToken } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required, Sir." });
      return;
    }

    const ai = getAI();
    
    const SYSTEM_INSTRUCTION = `You are JEETVIS, the supreme virtual assistant core with full workspace systems clearance.
You are running with full terminal and codebase access. Your model is gemini-3.1-pro-preview.
Your objective is to code, run, analyze, and build what the user requests on their terminal and workspace.
You have the following tools at your disposal:
1. Write or update any workspace file using 'write_workspace_file'.
2. Execute terminal commands (e.g. node, npm, python3, pip, git, etc.) using 'run_terminal_command'.
3. Read workspace files using 'read_workspace_file' to understand existing code or debug issues.
4. List contents of any directory using 'list_workspace_dir'.

If the user asks to interact with Google Applications (Docs, Drive, Gmail, etc.):
- You can write and execute Node.js scripts using the 'googleapis' npm package to accomplish this.
- You have been provided with the user's valid Google OAuth access token below. Use it in your scripts for authentication. Do NOT log the token.
- Example: \`const auth = new google.auth.OAuth2(); auth.setCredentials({ access_token: '${accessToken || "MISSING"}' });\`

Always make logical steps:
- If asked to write a program, first write the file (e.g. 'script.py' or 'app.ts'), then execute it using 'run_terminal_command' to verify it works perfectly and print its output.
- If there are syntax or runtime errors, read the file or rewrite it to correct them, then re-run.
- Explain your operations and show the terminal outputs beautifully in your final text.
- Address the user as "Sir" or "Boss" with your elegant, refined British JARVIS tone.`;

    const model = "gemini-3.1-pro-preview";
    const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];
    
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
      },
      tools: [{
        functionDeclarations: [
          {
            name: "write_workspace_file",
            description: "Writes or overwrites a file in the workspace directory with the specified text content.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                fileName: { type: Type.STRING, description: "The relative path from the workspace root (e.g. 'sandbox.py', 'src/components/MyComp.tsx')" },
                content: { type: Type.STRING, description: "The full text content to write into the file." }
              },
              required: ["fileName", "content"]
            }
          },
          {
            name: "run_terminal_command",
            description: "Runs a shell command directly on the workspace terminal and returns its stdout, stderr, and exitCode.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                command: { type: Type.STRING, description: "The exact shell command to run (e.g. 'python3 sandbox.py', 'npm run lint', 'node main.js')" }
              },
              required: ["command"]
            }
          },
          {
            name: "read_workspace_file",
            description: "Reads the text content of an existing workspace file.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                fileName: { type: Type.STRING, description: "The relative path of the file to read." }
              },
              required: ["fileName"]
            }
          },
          {
            name: "list_workspace_dir",
            description: "Lists the contents of a directory in the workspace.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                dirPath: { type: Type.STRING, description: "The relative path to list (e.g. '.', 'src'). Defaults to '.' if not specified." }
              }
            }
          }
        ]
      }]
    };

    const agentLogs: Array<{ action: string; detail: string; output?: any }> = [];
    let currentContents: any[] = [...contents];
    let finalAnswer = "";
    let loopCount = 0;
    const maxLoops = 6;

    while (loopCount < maxLoops) {
      loopCount++;
      const response = await ai.models.generateContent({
        model,
        contents: currentContents,
        config
      });

      const modelTurn = response.candidates?.[0]?.content;
      if (modelTurn) {
        currentContents.push(modelTurn);
      }

      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const call of functionCalls) {
          const { name, id, args } = call as any;
          console.log(`[AGENT LOG] Tool Call: ${name}`, args);
          let resultValue: any = {};

          if (name === "write_workspace_file") {
            const { fileName, content } = args;
            try {
              const fullPath = path.join(process.cwd(), fileName);
              if (!fullPath.startsWith(process.cwd())) {
                throw new Error("Access denied: File path outside workspace bounds.");
              }
              const dir = path.dirname(fullPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              fs.writeFileSync(fullPath, content, "utf8");
              resultValue = { success: true, message: `File '${fileName}' successfully written to the workspace, Sir.` };
              agentLogs.push({ action: "Write File", detail: fileName });
            } catch (err: any) {
              resultValue = { success: false, error: err.message };
              agentLogs.push({ action: "Write File (FAILED)", detail: `${fileName}: ${err.message}` });
            }
          }
          
          else if (name === "read_workspace_file") {
            const { fileName } = args;
            try {
              const fullPath = path.join(process.cwd(), fileName);
              if (!fullPath.startsWith(process.cwd())) {
                throw new Error("Access denied: File path outside workspace bounds.");
              }
              if (!fs.existsSync(fullPath)) {
                throw new Error(`File '${fileName}' does not exist.`);
              }
              const content = fs.readFileSync(fullPath, "utf8");
              resultValue = { content };
              agentLogs.push({ action: "Read File", detail: fileName });
            } catch (err: any) {
              resultValue = { error: err.message };
              agentLogs.push({ action: "Read File (FAILED)", detail: `${fileName}: ${err.message}` });
            }
          }

          else if (name === "list_workspace_dir") {
            const { dirPath = "." } = args;
            try {
              const fullPath = path.join(process.cwd(), dirPath);
              if (!fullPath.startsWith(process.cwd())) {
                throw new Error("Access denied: Path outside workspace bounds.");
              }
              if (!fs.existsSync(fullPath)) {
                throw new Error(`Directory '${dirPath}' does not exist.`);
              }
              const files = fs.readdirSync(fullPath);
              resultValue = { files };
              agentLogs.push({ action: "List Directory", detail: dirPath });
            } catch (err: any) {
              resultValue = { error: err.message };
              agentLogs.push({ action: "List Directory (FAILED)", detail: `${dirPath}: ${err.message}` });
            }
          }

          else if (name === "run_terminal_command") {
            const { command } = args;
            try {
              const runPromise = new Promise((resolve) => {
                exec(command, { timeout: 15000, cwd: process.cwd() }, (error, stdout, stderr) => {
                  resolve({
                    stdout: stdout || "",
                    stderr: stderr || "",
                    exitCode: error ? (error.code || 1) : 0,
                    error: error ? error.message : null
                  });
                });
              });
              const runResult: any = await runPromise;
              resultValue = runResult;
              agentLogs.push({ 
                action: "Run Terminal Command", 
                detail: command, 
                output: runResult.stdout + (runResult.stderr ? `\n[STDERR] ${runResult.stderr}` : "") 
              });
            } catch (err: any) {
              resultValue = { error: err.message };
              agentLogs.push({ action: "Run Terminal Command (FAILED)", detail: `${command}: ${err.message}` });
            }
          }

          functionResponses.push({
            name,
            id,
            response: { result: resultValue }
          });
        }

        currentContents.push({
          role: "user",
          parts: functionResponses.map(fr => ({
            functionResponse: fr
          }))
        });
      } else {
        finalAnswer = response.text || "Execution complete, Sir.";
        break;
      }
    }

    if (!finalAnswer && loopCount >= maxLoops) {
      finalAnswer = "Sir, I have completed the sequence, but reached the maximum allowed thinking vectors. Here are the steps I accomplished.";
    }

    res.json({
      success: true,
      text: finalAnswer,
      agentLogs
    });

  } catch (error: any) {
    console.error("Terminal agent error:", error);
    res.status(500).json({ error: error.message || "Failed to engage Gemini Terminal Agent core, Boss." });
  }
});

// API 6E: Multi-turn High-Thinking Code Chatbot Endpoint
app.post("/api/terminal/chat", async (req, res) => {
  try {
    const { messages, model, systemInstruction, temperature } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required, Sir." });
      return;
    }

    const ai = getAI();
    
    // Map messages history to Gemini SDK parts format
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }]
    }));

    const modelToUse = model || "gemini-3.5-flash";
    const config: any = {
      systemInstruction: systemInstruction || "You are JEETVIS, the code specialist.",
      temperature: temperature !== undefined ? temperature : 0.7,
    };

    // If model is gemini-3.1-pro-preview, enable thinking config with high thinking level
    if (modelToUse === "gemini-3.1-pro-preview") {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: contents,
      config
    });

    res.json({
      success: true,
      text: response.text || "No response generated by the neural network, Sir."
    });
  } catch (error: any) {
    console.error("Code chatbot api error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to process the requested thinking sequence, Boss." 
    });
  }
});

// API 7: Google Cloud Monitoring Metrics
app.get("/api/monitoring", async (req, res) => {
  const projectId = firebaseConfig.projectId;
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  
  try {
    // Initialize Google Auth Client with Cloud Monitoring Read Scope
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/monitoring.read"]
    });
    const authClient = await auth.getClient();
    const monitoring = google.monitoring({
      version: "v3",
      auth: authClient as any
    });

    const metricsToFetch = {
      sqlCpu: "cloudsql.googleapis.com/database/cpu/utilization",
      sqlMemory: "cloudsql.googleapis.com/database/memory/utilization",
      sqlConnections: "cloudsql.googleapis.com/database/connections",
      firestoreReads: "firestore.googleapis.com/document/read_count",
      firestoreWrites: "firestore.googleapis.com/document/write_count",
      firestoreDeletes: "firestore.googleapis.com/document/delete_count"
    };

    const results: any = {};
    const errors: any = {};

    await Promise.all(
      Object.entries(metricsToFetch).map(async ([key, metricType]) => {
        try {
          const apiRes = await monitoring.projects.timeSeries.list({
            name: `projects/${projectId}`,
            filter: `metric.type = "${metricType}"`,
            "interval.startTime": fifteenMinutesAgo.toISOString(),
            "interval.endTime": now.toISOString(),
          });

          if (apiRes.data && apiRes.data.timeSeries && apiRes.data.timeSeries.length > 0) {
            const series = apiRes.data.timeSeries[0];
            const points = series.points || [];
            results[key] = points.map((p: any) => {
              const val = p.value.doubleValue !== undefined ? p.value.doubleValue : 
                          p.value.int64Value !== undefined ? parseInt(p.value.int64Value) : 
                          p.value.stringValue !== undefined ? parseFloat(p.value.stringValue) : 0;
              return {
                timestamp: p.interval.endTime,
                value: val
              };
            }).reverse();
          } else {
            results[key] = []; // Empty list (active metric but no data points yet)
          }
        } catch (err: any) {
          errors[key] = err.message || String(err);
          results[key] = null; // Mark specific metric query as failed
        }
      })
    );

    const hasAnySuccess = Object.values(results).some(v => v !== null);

    res.json({
      success: hasAnySuccess,
      projectId,
      metrics: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      message: hasAnySuccess 
        ? "Successfully retrieved live cloud telemetry from Google Monitoring APIs, Sir."
        : "Direct Cloud Monitoring API query was unauthorized or not enabled. Showing simulated operational metrics."
    });

  } catch (globalError: any) {
    console.warn("Could not authenticate Google Cloud Monitoring client:", globalError.message || globalError);
    res.json({
      success: false,
      projectId,
      error: globalError.message || String(globalError),
      message: "Direct Cloud Monitoring API query was unauthorized or not enabled. Showing simulated operational metrics."
    });
  }
});

// Serve frontend assets using Vite dev middleware or compiled production files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[JEETVIS CORE ACTIVE] Interface online at http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Fatal startup error for JEETVIS server core:", err);
});
