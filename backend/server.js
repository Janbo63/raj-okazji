
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
  if (!ZOHO_REFRESH_TOKEN || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) throw new Error('ZOHO_AUTH_MISSING');
  
  const params = new URLSearchParams();
  params.append('refresh_token', ZOHO_REFRESH_TOKEN);
  params.append('client_id', ZOHO_CLIENT_ID);
  params.append('client_secret', ZOHO_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', { method: 'POST', body: params });
  const data = await response.json();
  if (!data.access_token) throw new Error('ZOHO_TOKEN_REFRESH_FAILED');

  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

// --- API ROUTES ---
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', service: 'Raj Okazji Webstore', timestamp: new Date().toISOString() });
});

app.get('/api/zoho/items', async (req, res) => {
  try {
    const token = await getZohoAccessToken();
    const response = await fetch(`https://inventory.zoho.com/api/v1/items?organization_id=${process.env.ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- STATIC FILES & SPA ROUTING ---
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // DIAGNOSTIC VIEW
    const filesInRoot = fs.readdirSync(path.resolve(__dirname, '..')).join(', ');
    res.status(200).send(`
      <div style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
        <h1 style="color: #6d28d9;">Raj Okazji Debugger</h1>
        <p><b>Status:</b> Backend is RUNNING on port ${PORT}.</p>
        <p><b>Error:</b> Frontend files not found at <code>${indexPath}</code>.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><b>Files in project root:</b><br><code>${filesInRoot}</code></p>
        </div>
        <p><b>Required Fix:</b></p>
        <ol>
          <li>Run <code>ls -la</code> in <code>/var/www/rajokazji-webstore</code> to see if <b>index.html</b> exists there.</li>
          <li>If missing, re-upload the files.</li>
          <li>Then run <code>npm run build</code> again.</li>
        </ol>
      </div>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Storefront Server running on port ${PORT}`);
});

