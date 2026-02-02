import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { storeMessage, getSession } from './storeMemory.js';
import { queryGroq } from './groq.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint pentru widget chat
app.post('/chat', async (req, res) => {
  const { storeId, sessionId, message } = req.body;

  if (!storeId || !sessionId || !message) return res.status(400).json({ reply: "Date lipsă" });

  // Stochează mesaj
  storeMessage(storeId, sessionId, message);

  // Obține răspuns AI de la Groq
  const aiReply = await queryGroq(`Magazin: ${storeId}\nÎntrebare client: ${message}`);
  res.json({ reply: aiReply });
});

// Dashboard pentru client
app.get('/dashboard', (req, res) => {
  const store = req.query.store;
  if (!store) return res.status(400).json({ error: 'Store missing' });

  const data = getSession(store);
  res.json(data);
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`WooMate AI live pe port ${PORT}`);
});
