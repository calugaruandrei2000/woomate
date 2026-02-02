import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { storeMessage, getSession, storeSale } from './storeMemory.js';
import { queryGroq } from './groq.js';
import express from 'express';
import bodyParser from 'body-parser';
import { storeSubscription } from './storeMemory.js';
import { getSubscription } from './storeMemory.js';
import { getAIActivity, getAIMetrics } from './storeMemory.js'; // sau DB real

app.get('/get-plan', (req,res) => {
  const storeId = req.query.store || 'demo-store';
  const plan = getSubscription(storeId);
  res.json({ plan });
});

app.get('/dashboard', (req,res) => {
  const storeId = req.query.store || 'demo-store';
  const activity = getAIActivity(storeId);  // array cu {time,message}
  const metrics = getAIMetrics(storeId);    // array cu {date,interactions,conversions,revenue}
  res.json({ activity, metrics });
});


const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/subscribe', (req, res) => {
  const { plan } = req.body;
  const storeId = req.headers['x-store-id'] || 'demo-store';
  
  // Salvează planul în memoria serverului sau DB
  storeSubscription(storeId, plan);

  res.json({ success: true, plan });
});

app.listen(process.env.PORT || 5000, () => console.log('Server AI live 🚀'));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint pentru chat widget
app.post('/chat', async (req, res) => {
  const { storeId, sessionId, message } = req.body;
  if (!storeId || !sessionId || !message) return res.status(400).json({ reply: "Date lipsă" });

  storeMessage(storeId, sessionId, message);

  const aiReply = await queryGroq(`Magazin: ${storeId}\nÎntrebare client: ${message}`);
  res.json({ reply: aiReply });
});

// Endpoint pentru dashboard
app.get('/dashboard', (req, res) => {
  const store = req.query.store;
  if (!store) return res.status(400).json({ error: 'Store missing' });

  const data = getSession(store);
  res.json(data);
});

// Endpoint pentru înregistrare vânzări AI
app.post('/track-sale', (req, res) => {
  const { storeId, orderId, aiGenerated } = req.body;
  if (!storeId || !orderId || !aiGenerated) return res.status(400).json({ error: 'Date lipsă' });

  storeSale(storeId, orderId, aiGenerated);
  res.json({ success: true });
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log(`WooMate AI backend live pe port ${PORT}`));
