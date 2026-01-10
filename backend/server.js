
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION - You will need to update these in your Hostinger Environment Variables
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const PORT = process.env.PORT || 3000;

let accessToken = '';

// Helper to get a fresh Zoho Access Token using the Refresh Token
async function refreshZohoToken() {
  const url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;
  
  try {
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('Zoho Token Refreshed Successfully');
    }
  } catch (error) {
    console.error('Error refreshing Zoho token:', error);
  }
}

// Proxy for Zoho Items
app.get('/api/zoho/items', async (req, res) => {
  if (!accessToken) await refreshZohoToken();
  
  const orgId = req.query.organization_id;
  try {
    const response = await fetch(`https://inventory.zoho.com/api/v1/items?organization_id=${orgId}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items from Zoho' });
  }
});

// Proxy for creating Sales Orders
app.post('/api/zoho/salesorders', async (req, res) => {
  if (!accessToken) await refreshZohoToken();
  
  const orgId = req.query.organization_id;
  try {
    const response = await fetch(`https://inventory.zoho.com/api/v1/salesorders?organization_id=${orgId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order in Zoho' });
  }
});

// Serve static frontend files from the 'dist' folder (created by the build)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
