import express from 'express';
import { GoogleGenAI } from '@google/genai';
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

  const response = await fetch('https://accounts.zoho.eu/oauth/v2/token', { method: 'POST', body: params });
  const data = await response.json();

  if (!data.access_token) throw new Error('ZOHO_AUTH_FAILED');

  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

// --- API ROUTES ---
const apiRouter = express.Router();

// --- GEMINI PROXY ENDPOINT ---
apiRouter.post('/gemini/advice', async (req, res) => {
  const { query, lang } = req.body;
  if (!query || !lang) {
    return res.status(400).json({ error: 'Missing query or lang' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = lang === 'pl'
      ? "Jesteś asystentem zakupowym w sklepie 'Raj Okazji'. Sklep sprzedaje zwroty z aukcji i nadwyżki z UK w cenach -50%. Pomagaj klientom wybierać okazje i odpowiadaj na pytania o model biznesowy (wysoka jakość, niska cena, sprawdzone produkty)."
      : "You are a shopping assistant for 'Raj Okazji'. We sell auction returns and UK liquidation stock at 50%+ discounts. Help customers find deals and explain our model (high quality, low price, quality-checked products).";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    res.json({ advice: response.text || (lang === 'pl' ? "Przepraszam, nie mogłem przetworzyć zapytania." : "Sorry, I couldn't process your request.") });
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    res.status(500).json({ error: lang === 'pl' ? "Wystąpił błąd asystenta AI." : "AI Assistant error occurred." });
  }
});

apiRouter.get('/status', (req, res) => {
  res.json({ status: 'online', port: PORT, version: appVersion, uptime: process.uptime() });
});

apiRouter.get('/version', (req, res) => {
  res.json({ version: appVersion, timestamp: new Date().toISOString() });
});

apiRouter.get('/health-check', async (req, res) => {
  const check = {
    env: {
      ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID ? 'Set' : 'Missing',
      ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Missing',
      ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN ? 'Set' : 'Missing',
      ZOHO_ORG_ID: process.env.ZOHO_ORG_ID ? 'Set' : 'Missing',
      PORT: process.env.PORT
    },
    connectivity: 'Pending',
    error: null
  };

  try {
    const token = await getZohoAccessToken();
    check.connectivity = token ? 'Success (Token Generated)' : 'Failed';
  } catch (e) {
    check.connectivity = 'Failed';
    check.error = e.message;
    // If it's an invalid client error, it reveals secret issues
    if (e.message.includes('invalid_client')) check.hint = 'Client ID/Secret is wrong';
  }

  res.json(check);
});

apiRouter.get('/zoho/items', async (req, res) => {
  try {
    const orgId = process.env.ZOHO_ORG_ID;
    const token = await getZohoAccessToken();
    const response = await fetch(`https://www.zohoapis.eu/inventory/v1/items?organization_id=${orgId}`, {
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
    const response = await fetch(`https://www.zohoapis.eu/inventory/v1/items/${req.params.id}?organization_id=${orgId}`, {
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
    const response = await fetch(`https://www.zohoapis.eu/inventory/v1/salesorders?organization_id=${orgId}`, {
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

apiRouter.get('/zoho/images/:itemId/:imageId', async (req, res) => {
  try {
    const { itemId, imageId } = req.params;
    const orgId = process.env.ZOHO_ORG_ID;
    const token = await getZohoAccessToken();

    // Zoho Image URL format
    const imageUrl = `https://www.zohoapis.eu/inventory/v1/items/${itemId}/images/${imageId}?organization_id=${orgId}`;

    const response = await fetch(imageUrl, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });

    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    // Forward headers (Content-Type is important)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Stream the image data to the client
    response.body.pipe(res);

  } catch (error) {
    console.error('Image Proxy Error:', error);
    res.status(404).send('Image not found');
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
});
