import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
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
const PORT = process.env.PORT || 3200; // Updated to 3200 for Caddy alignment

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
    // Cache for 55 minutes
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
    hasRefreshToken: !!ZOHO_REFRESH_TOKEN,
    hasGeminiKey: !!process.env.API_KEY,
    orgId: ZOHO_ORG_ID
  });
});

app.get('/api/activate-zoho', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided. Append ?code=YOUR_CODE to the URL.');
  
  const url = `https://accounts.zoho.com/oauth/v2/token?code=${code}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=authorization_code`;
  try {
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    console.log('Zoho Activation Attempt:', data);
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
    console.error('Items Fetch Error:', error.message);
    res.status(error.message.includes('MISSING_REFRESH_TOKEN') ? 403 : 500).json({ error: error.message });
  }
});

// Serve static files from the 'dist' directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------------------------------------');
  console.log(`🚀 Raj Okazji Store running on port ${PORT}`);
  console.log(`🔗 Access locally at: http://localhost:${PORT}`);
  console.log(`🔑 Zoho Config: ${ZOHO_CLIENT_ID ? 'SET' : 'MISSING'}`);
  console.log(`🔄 Refresh Token: ${ZOHO_REFRESH_TOKEN ? 'SET' : 'NOT YET ACTIVATED'}`);
  console.log(`🤖 Gemini AI Key: ${process.env.API_KEY ? 'SET' : 'MISSING'}`);
  console.log('--------------------------------------------------');
});