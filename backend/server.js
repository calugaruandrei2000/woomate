import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { storeMessage, getSession, storeSale, storeSubscription, getSubscription, getAIActivity, getAIMetrics } from './storeMemory.js';
import { queryGroq } from './groq.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ENDPOINTS ====================

// Chat widget
app.post('/chat', async (req, res) => {
  const { storeId, sessionId, message } = req.body;
  if (!storeId || !sessionId || !message) return res.status(400).json({ reply: "Date lipsă" });

  storeMessage(storeId, sessionId, message);

  try {
    const aiReply = await queryGroq(`Magazin: ${storeId}\nÎntrebare client: ${message}`);
    res.json({ reply: aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Eroare AI" });
  }
});

// Dashboard
app.get('/dashboard', (req, res) => {
  const storeId = req.query.store;
  if (!storeId) return res.status(400).json({ error: 'Store lipsă' });

  const activity = getAIActivity(storeId);
  const metrics = getAIMetrics(storeId);

  res.json({ activity, metrics });
});

// Plan activ
app.get('/get-plan', (req, res) => {
  const storeId = req.query.store || 'demo-store';
  const plan = getSubscription(storeId);
  res.json({ plan });
});

// Abonare / schimbare plan
app.post('/subscribe', (req, res) => {
  const { plan } = req.body;
  const storeId = req.headers['x-store-id'] || 'demo-store';
  
  storeSubscription(storeId, plan);

  res.json({ success: true, plan });
});

// Înregistrare vânzări generate de AI
app.post('/track-sale', (req, res) => {
  const { storeId, orderId, aiGenerated } = req.body;
  if (!storeId || !orderId || !aiGenerated) return res.status(400).json({ error: 'Date lipsă' });

  storeSale(storeId, orderId, aiGenerated);
  res.json({ success: true });
});

// Serve static files (pentru frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ==================== START SERVER ====================
app.listen(PORT, () => console.log(`WooMate AI backend live pe port ${PORT}`));



app.post('/register-store', async (req, res) => {
  const { storeUrl, email, password } = req.body;
  if(!storeUrl || !email || !password){
    return res.status(400).json({ error: 'Date incomplete' });
  }

  try {
    // 1. Creează un cont în baza noastră de date / memorie
    const storeId = storeUrl.replace(/https?:\/\//,'').replace(/\./g,'_');
    storeSubscription(storeId, 'trial'); // pachet trial implicit
    storeMessage(storeId, 'system', 'Magazin înregistrat cu succes');

    // 2. Generează plugin (fisier .zip sau link de download)
    // În MVP putem returna doar un link demo către plugin
    const pluginLink = `/plugin/WooMateAI.zip`;

    res.json({ success: true, pluginLink });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Eroare server' });
  }
});

