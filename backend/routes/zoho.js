import express from 'express';
import fetch from 'node-fetch';
import { Readable } from 'stream';

const router = express.Router();

// Zoho OAuth Helper (reused from server.js logic)
async function getZohoAccessToken() {
    // This will be passed from the app locals or a closure
    return process.env.CACHED_ZOHO_TOKEN;
}

export function createZohoRouter(getAccessToken) {
    const router = express.Router();
    const orgId = process.env.ZOHO_ORG_ID;
    const region = process.env.ZOHO_REGION || 'eu';
    const apiBase = region === 'eu' ? 'https://www.zohoapis.eu/inventory/v1' : 'https://inventory.zoho.com/api/v1';

    // --- Activation / Setup Route ---
    router.get('/activate', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: "Missing 'code' query parameter" });

        const regions = ['eu', 'com'];
        let lastError = null;

        for (const region of regions) {
            try {
                const params = new URLSearchParams({
                    code,
                    client_id: process.env.ZOHO_CLIENT_ID,
                    client_secret: process.env.ZOHO_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    redirect_uri: req.query.redirect_uri || `http://localhost:3300/api/zoho/activate`
                });

                console.log(`Attempting Zoho Activation on .${region}...`);
                const response = await fetch(`https://accounts.zoho.${region}/oauth/v2/token`, {
                    method: 'POST',
                    body: params
                });
                const data = await response.json();

                if (data.refresh_token) {
                    return res.json({
                        message: `SUCCESS! Your account is on the .${region} region.`,
                        region,
                        refresh_token: data.refresh_token,
                        instruction: "Copy this refresh_token to your .env file."
                    });
                } else if (data.error !== 'invalid_client') {
                    // If we get a real error that isn't invalid_client, it might be the right region but wrong code
                    return res.json({
                        message: `Found correct region (.${region}) but encountered an error.`,
                        data
                    });
                }
                lastError = data;
            } catch (error) {
                lastError = { error: error.message };
            }
        }

        res.status(400).json({
            error: "Failed on all regions (.eu and .com)",
            details: lastError,
            hint: "Check if your Client ID/Secret match the Zoho API Console exactly and that you are using the correct Redirect URI."
        });
    });

    router.get('/items', async (req, res) => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${apiBase}/items?organization_id=${orgId}`, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
            });
            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/items/:id', async (req, res) => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${apiBase}/items/${req.params.id}?organization_id=${orgId}`, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
            });
            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/salesorders', async (req, res) => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${apiBase}/salesorders?organization_id=${orgId}`, {
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

    router.get('/images/:itemId/:imageId', async (req, res) => {
        try {
            const { itemId, imageId } = req.params;
            const token = await getAccessToken();
            const imageUrl = `${apiBase}/items/${itemId}/images/${imageId}?organization_id=${orgId}`;

            const response = await fetch(imageUrl, {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
            });

            if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

            res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            Readable.fromWeb(response.body).pipe(res);
        } catch (error) {
            console.error('Image Proxy Error:', error);
            res.status(404).send('Image not found');
        }
    });

    return router;
}
