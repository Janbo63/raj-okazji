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

// 1. SETTINGS & LOGGING
const PORT = process.env.PORT || 3200;
console.log(`[INIT] Starting Raj Okazji Server...`);
console.log(`[INIT] Directory: ${__dirname}`);
console.log(`[INIT] NODE_ENV: ${process.env.NODE_ENV}`);

// 2. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 3. PRIORITY API ROUTES (Must be before static)
app.get('/api/status', (req, res) => {
  console.log('[DEBUG] Status check requested');
  res.status(200).json({ 
    status: 'ok',
    app: 'raj-okazji-api',
    version: '2.0.3',
    timestamp: new Date().toISOString(),
    dir: __dirname,
    node: process.version
  });
});

app.get('/api/zoho/items', async (req, res) => {
  const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID || '866851240';
  const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  
  try {
    // Basic auth check logic here...
    res.json({ message: "Zoho endpoint ready. Ensure Secrets are set." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. STATIC ASSETS
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  console.log(`[INIT] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  
  // SPA Fallback
  app.get('*', (req, res) => {
    // Do not serve index.html for unknown API calls
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(indexPath);
  });
} else {
  console.warn(`[WARN] Dist folder not found at ${distPath}`);
  app.get('/', (req, res) => {
    res.status(200).send("API is running. Frontend (dist) is missing.");
  });
}

// 5. START
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n--------------------------------------------------`);
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`--------------------------------------------------\n`);
});