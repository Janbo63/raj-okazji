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
const PORT = process.env.PORT || 3300; 

app.use(cors());
app.use(express.json());

// --- ZOHO OAUTH HELPERS ---
let cachedAccessToken = null;
let tokenExpiry = 0;

async function getZohoAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) return cachedAccessToken;
  
  const { ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET } = process.env;
  if (!ZOHO_REFRESH_TOKEN || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
    throw new Error('ZOHO_CREDENTIALS_MISSING');
  }
  
  const params = new URLSearchParams();
  params.append('refresh_token', ZOHO_REFRESH_TOKEN);
  params.append('client_id', ZOHO_CLIENT_ID);
  params.append('client_secret', ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', { method: 'POST', body: params });
  const data = await response.json();
  
  if (!data.access_token) throw new Error('ZOHO_AUTH_FAILED');

  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

// --- API ROUTES ---
const apiRouter = express.Router();

apiRouter.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

apiRouter.get('/zoho/items', async (req, res) => {
  try {
    const orgId = process.env.ZOHO_ORG_ID;
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/items?organization_id=${orgId}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/zoho/items/:id', async (req, res) => {
  try {
    const orgId = process.env.ZOHO_ORG_ID;
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/items/${req.params.id}?organization_id=${orgId}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/zoho/salesorders', async (req, res) => {
  try {
    const orgId = process.env.ZOHO_ORG_ID;
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/salesorders?organization_id=${orgId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explicitly mount API router BEFORE static files
app.use('/api', apiRouter);

// --- STATIC FILES ---
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA Fallback - Express 5 requires (.*) for wildcards
app.get('(.*)', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `API endpoint ${req.path} not found.` });
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Site Under Maintenance</h1>
          <p>The frontend build is currently missing or being updated. Please try again in 1 minute.</p>
          <p style="color: #666; font-size: 0.8em;">Error: dist/index.html not found</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

