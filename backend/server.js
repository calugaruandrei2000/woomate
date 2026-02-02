import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { askGroq } from "./groq.js";
import { stores } from "./storeMemory.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/recommend", async (req, res) => {
  const { store, sessionId, message } = req.body;
  if (!stores[store]) stores[store] = { conversations: 0, messages: 0 };
  stores[store].conversations++;
  stores[store].messages++;
  const reply = await askGroq(message);
  res.json({ reply });
});

app.get("/dashboard", (req, res) => {
  const store = req.query.store;
  const data = stores[store] || { conversations: 0, messages: 0 };
  res.json({
    metrics: [
      { label: "Conversații AI", value: data.conversations },
      { label: "Mesaje", value: data.messages }
    ],
    topProducts: []
  });
});

app.listen(process.env.PORT || 3000, () => console.log("Backend running"));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

