import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { createZohoRouter } from './routes/zoho.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

// --- Setup & Validation ---
const REQUIRED_ENV = [
  'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN',
  'ZOHO_ORG_ID', 'GEMINI_API_KEY'
];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
  console.warn(`[WARNING] Zoho features and Gemini AI may not work until configured.`);
}

// --- Zoho Token Management ---
let cachedToken = { value: null, expiry: 0 };

async function getZohoAccessToken() {
  if (cachedToken.value && Date.now() < cachedToken.expiry) return cachedToken.value;

  const region = process.env.ZOHO_REGION || 'eu';
  console.log(`Refreshing Zoho Access Token (${region})...`);
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const response = await fetch(`https://accounts.zoho.${region}/oauth/v2/token`, { method: 'POST', body: params });
  const data = await response.json();

  if (!data.access_token) throw new Error("Failed to refresh Zoho token: " + JSON.stringify(data));

  cachedToken = {
    value: data.access_token,
    expiry: Date.now() + (data.expires_in - 300) * 1000 // 5 min cushion
  };
  return cachedToken.value;
}

// --- Routes ---
app.use('/api/zoho', createZohoRouter(getZohoAccessToken));
app.use('/api/gemini', aiRouter);

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', port: PORT, timestamp: new Date() });
});

// --- Static Files ---
// Serve static files from the 'dist' directory (one level up from 'backend')
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 RAJ OKAZJI BACKEND v4.0`);
  console.log(`Running on http://0.0.0.0:${PORT}`);
  console.log(`-------------------------------------------`);
});
