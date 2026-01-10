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

// 1. SETTINGS & LOGGING - CHANGED TO 3300
const PORT = process.env.PORT || 3300;
console.log(`\n[BOOT] ==========================================`);
console.log(`[BOOT] Raj Okazji Webstore API v2.0.5`);
console.log(`[BOOT] Port: ${PORT}`);
console.log(`[BOOT] Absolute Path: ${__dirname}`);
console.log(`[BOOT] ==========================================\n`);

// 2. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 3. THE "GOLDEN" STATUS ROUTE
app.get('/api/status', (req, res) => {
  console.log(`[DEBUG] Received status request from ${req.ip}`);
  res.status(200).json({ 
    status: 'ok',
    identification: 'RAJ_OKAZJI_WEBSTORE_V2',
    port: PORT,
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      cwd: process.cwd()
    }
  });
});

// 4. ZOHO PROXY
app.get('/api/zoho/items', async (req, res) => {
  const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID || '866851240';
  const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  
  if (!ZOHO_REFRESH_TOKEN) {
    return res.status(500).json({ error: "ZOHO_REFRESH_TOKEN not configured" });
  }

  // Placeholder for the actual Zoho logic
  res.json({ message: "Zoho Proxy Active on Port 3300", org: ZOHO_ORG_ID });
});

// 5. STATIC ASSETS
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
    res.sendFile(indexPath);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[READY] Webstore API listening on http://0.0.0.0:${PORT}`);
});