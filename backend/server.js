import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { handleGroqChat } from './groq.js';
import { storeMessage, getSession } from './storeMemory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // 🔴 OBLIGATORIU ÎNAINTE de app.use

app.use(cors());
app.use(express.json());

/* =======================
   STATIC FRONTEND
======================= */
app.use(express.static(path.join(__dirname, 'public')));

/* =======================
   ROUTES FRONTEND
======================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

/* =======================
   API ROUTES
======================= */
app.post('/chat', async (req, res) => {
  const { sessionId, message, storeUrl } = req.body;

  storeMessage(sessionId, 'user', message);

  const history = getSession(sessionId);

  const reply = await handleGroqChat(history, storeUrl);

  storeMessage(sessionId, 'assistant', reply);

  res.json({ reply });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WooMate AI running on port ${PORT}`);
});
