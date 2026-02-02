import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { storeSubscription, getSubscription, storeAIActivity, storeSale, getAIActivity, getAIMetrics } from './storeMemory.js';
import { activatePlugin, getStoreFeatures } from './pluginData.js';
import { queryGroq } from './groq.js';

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Înregistrare magazin + pachet
app.post('/register-store', (req,res)=>{
  const { storeUrl, email, password, plan } = req.body;
  if(!storeUrl || !email || !password || !plan) return res.status(400).json({error:'Date lipsă'});

  // Salvează plan și activează pluginul
  storeSubscription(storeUrl, plan);
  const features = activatePlugin(storeUrl, plan);

  // În realitate aici am face cont real + trimitere plugin personalizat
  const pluginLink = `/public/plugins/${plan}-plugin.zip`;

  res.json({ success:true, pluginLink, features });
});

// Dashboard magazin
app.get('/dashboard', (req,res)=>{
  const store = req.query.store;
  if(!store) return res.status(400).json({error:'Store lipsă'});
  
  const metrics = getAIMetrics(store);
  const activity = getAIActivity(store);
  const features = getStoreFeatures(store);

  res.json({ metrics, activity, features });
});

// Endpoint pentru AI (Groq)
app.post('/chat', async (req,res)=>{
  const { storeId, sessionId, message } = req.body;
  if(!storeId || !sessionId || !message) return res.status(400).json({reply:"Date lipsă"});

  storeAIActivity(storeId, message); // stocăm interacțiunea

  const aiReply = await queryGroq(`Magazin: ${storeId}\nÎntrebare client: ${message}`);
  res.json({ reply: aiReply });
});

// Endpoint pentru vânzări AI
app.post('/track-sale', (req,res)=>{
  const { storeId, orderId, revenue } = req.body;
  if(!storeId || !orderId || revenue==null) return res.status(400).json({error:'Date lipsă'});

  storeSale(storeId, revenue);
  res.json({success:true});
});

// Serve static files
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname,'public/index.html'));
});

app.listen(PORT, ()=>console.log(`WooMate AI backend live pe port ${PORT}`));
