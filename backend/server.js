import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json to get version
const packageJsonPath = path.resolve(__dirname, '../package.json');
let appVersion = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  appVersion = pkg.version;
} catch (e) {
  console.error("Could not read package.json version");
}

const app = express();
const PORT = process.env.PORT || 3300; 

console.log('-------------------------------------------');
console.log(`🚀 RAJ OKAZJI BOOT SEQUENCE v${appVersion}`);
console.log(`Port: ${PORT}`);
console.log(`Node Version: ${process.version}`);
console.log('-------------------------------------------');

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
  res.json({ status: 'online', port: PORT, version: appVersion, uptime: process.uptime() });
});

apiRouter.get('/version', (req, res) => {
  res.json({ version: appVersion, timestamp: new Date().toISOString() });
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

app.use('/api', apiRouter);

// --- STATIC FILES & SPA FALLBACK ---
const distPath = path.resolve(__dirname, '../dist');

// Helper to disable caching for index.html
const setNoCache = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

// Serve static assets normally, but force no-cache on index.html if requested directly
app.use(express.static(distPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('index.html')) {
      setNoCache(res);
    }
  }
}));

// Express 5 SPA Fallback
app.get(/.*/, (req, res) => {
  // If it's an API call that leaked through, 404 it
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    // Force no-cache on the fallback index.html as well
    setNoCache(res);
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>Frontend Not Found</h1>
      <p>The 'dist' directory is missing. Please run <code>npm run build</code> on the server.</p>
    `);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[READY] Listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('[CRITICAL] Server failed to bind to port:', err.message);
  process.exit(1);
});