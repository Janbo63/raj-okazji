
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Global error handling to prevent silent PM2 crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3300; 

app.use(cors());
app.use(express.json());

// --- ZOHO OAUTH HELPERS ---
let cachedAccessToken = null;
let tokenExpiry = 0;

async function getZohoAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) {
    return cachedAccessToken;
  }

  const { ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET } = process.env;

  if (!ZOHO_REFRESH_TOKEN || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
    throw new Error('ZOHO_AUTH_MISSING');
  }

  const params = new URLSearchParams();
  params.append('refresh_token', ZOHO_REFRESH_TOKEN);
  params.append('client_id', ZOHO_CLIENT_ID);
  params.append('client_secret', ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    body: params
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('ZOHO_TOKEN_REFRESH_FAILED');
  }

  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

// --- API ROUTES ---

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Raj Okazji Webstore',
    port: PORT,
    zoho_ready: !!(process.env.ZOHO_ORG_ID && process.env.ZOHO_REFRESH_TOKEN),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/zoho/items', async (req, res) => {
  try {
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/items?organization_id=${process.env.ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message === 'ZOHO_AUTH_MISSING' ? 'Backend not configured with Zoho keys' : error.message });
  }
});

app.get('/api/zoho/items/:id', async (req, res) => {
  try {
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/items/${req.params.id}?organization_id=${process.env.ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/zoho/salesorders', async (req, res) => {
  try {
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/salesorders?organization_id=${process.env.ZOHO_ORG_ID}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STATIC FILES ---
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Express 5 requires named parameters for wildcards in path-to-regexp
  // Instead of '*', use '(.*)' or '/*'. '/*' is usually safest for catch-all SPA.
  app.get('/*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).send(`Raj Okazji Backend is running on port ${PORT}. (Static files not found in /dist)`);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log(`🚀 RAJ OKAZJI STOREFRONT ACTIVE`);
  console.log(`Port: ${PORT}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('-------------------------------------------');
});
