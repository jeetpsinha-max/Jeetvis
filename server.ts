import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({});

// Mock Drizzle Tasks Database
let tasks = [
    { id: 1, title: 'Initial task', status: 'pending' }
];

// GET /api/health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/voice/process
app.post('/api/voice/process', async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
             res.status(400).json({ error: 'transcript is required' });
             return;
        }
        
        // Mock processing voice transcript
        const responseText = `Processed voice command: "${transcript}"`;
        res.json({ success: true, action: 'routed', result: responseText });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
    // Returns user tasks using Drizzle ORM (mocked here)
    res.json({ success: true, data: tasks });
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
    const { title, status = 'pending' } = req.body;
    if (!title) {
         res.status(400).json({ error: 'title is required' });
         return;
    }
    const newTask = { id: tasks.length + 1, title, status };
    tasks.push(newTask);
    res.json({ success: true, data: newTask });
});

// POST /api/ai/query
app.post('/api/ai/query', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
             res.status(400).json({ error: 'query is required' });
             return;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: query,
        });

        res.json({ success: true, response: response.text });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

if (import.meta.env?.PROD === false || !import.meta.url) {
    app.listen(port, () => {
        console.log(`Jeetvis Server running on port ${port}`);
    });
} else {
    app.listen(port, () => {
        console.log(`Jeetvis Server running on port ${port}`);
    });
}
