import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Rate Limiting Headers Middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

app.use((req, res, next) => {
  const ip = req.ip || "127.0.0.1";
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString());
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - record.count).toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000).toString());

  next();
});

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// Mock Drizzle Tasks Database
let tasks = [
  { id: 1, title: 'Initial task', status: 'pending' }
];

// GET /api/health
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    service: 'jeetvis-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    geminiConfigured: Boolean(apiKey && apiKey !== "your_gemini_api_key_here")
  });
});

// POST /api/gemini/ask
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash', systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({
        error: "Bad Request",
        message: "The 'prompt' field is required in request body."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.json({
        success: true,
        response: `[Jeetvis Fallback Mode] Gemini API key not configured. Query processed: "${prompt}"`,
        fallback: true,
        model
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: prompt,
      ...(systemInstruction ? { config: { systemInstruction } } : {})
    });

    return res.json({
      success: true,
      response: response.text || "",
      fallback: false,
      model: model || 'gemini-2.5-flash'
    });
  } catch (error: any) {
    console.error("Jeetvis Gemini API error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Gemini processing failed",
      fallback: true
    });
  }
});

// POST /api/ai/query
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.json({
        success: true,
        response: `Fallback AI query result for: ${query}`,
        fallback: true
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
    });

    return res.json({ success: true, response: response.text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message, fallback: true });
  }
});

// POST /api/voice/process
app.post('/api/voice/process', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required' });
    }
    const responseText = `Processed voice command: "${transcript}"`;
    return res.json({ success: true, action: 'routed', result: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, data: tasks });
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { title, status = 'pending' } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const newTask = { id: tasks.length + 1, title, status };
  tasks.push(newTask);
  res.json({ success: true, data: newTask });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Jeetvis Server running on port ${port}`);
  });
}
