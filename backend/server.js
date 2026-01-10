import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID || '866851240';
const PORT = process.env.PORT || 3200;

// Resolve the dist path reliably
// On VPS, structure is /var/www/rajokazji-webstore/[backend, dist, package.json]
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

let cachedToken = '';

async function getAccessToken() {
  if (cachedToken) return cachedToken;
  
  if (!ZOHO_REFRESH_TOKEN) {
    throw new Error('MISSING_REFRESH_TOKEN: Please visit /api/activate-zoho?code=YOUR_CODE to initialize.');
  }

  const url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;
  
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  
  if (data.access_token) {
    cachedToken = data.access_token;
    setTimeout(() => { cachedToken = ''; }, 55 * 60 * 1000);
    return cachedToken;
  }
  throw new Error('Could not refresh Zoho token: ' + JSON.stringify(data));
}

app.get('/api/status', (req, res) => {
  res.json({ 
    app: 'Raj Okazji Online Store',
    status: 'active', 
    port: PORT,
    distPathExists: fs.existsSync(distPath),
    indexExists: fs.existsSync(indexPath),
    hasRefreshToken: !!ZOHO_REFRESH_TOKEN,
    orgId: ZOHO_ORG_ID
  });
});

app.get('/api/activate-zoho', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided.');
  
  const url = `https://accounts.zoho.com/oauth/v2/token?code=${code}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=authorization_code`;
  try {
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/zoho/items', async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = `https://inventory.zoho.com/api/v1/items?organization_id=${ZOHO_ORG_ID}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (error) {
    res.status(error.message.includes('MISSING_REFRESH_TOKEN') ? 403 : 500).json({ error: error.message });
  }
});

// SERVE STATIC FILES
if (fs.existsSync(distPath)) {
  console.log(`✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  
  // SPA routing: send index.html for any non-API request
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
    res.sendFile(indexPath);
  });
} else {
  console.error(`❌ CRITICAL: Dist directory not found at ${distPath}`);
  app.get('/', (req, res) => {
    res.status(500).send(`Backend is running, but frontend 'dist' folder is missing at ${distPath}. Please check your build/deployment.`);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------------------------------------');
  console.log(`🚀 Raj Okazji Store running on port ${PORT}`);
  console.log(`📂 Dist Path: ${distPath}`);
  console.log(`📄 Index Found: ${fs.existsSync(indexPath)}`);
  console.log('--------------------------------------------------');
});