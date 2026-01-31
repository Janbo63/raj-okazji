import express from 'express';
import Stripe from 'stripe';
import fetch from 'node-fetch';
import { calculateShippingCost } from '../utils/shipping.js';

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('[WARNING] STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
}

export function createPaymentRouter(getAccessToken) {
    const router = express.Router();
    const orgId = process.env.ZOHO_ORG_ID;
    const region = process.env.ZOHO_REGION || 'eu';
    const apiBase = region === 'eu' ? 'https://www.zohoapis.eu/inventory/v1' : 'https://inventory.zoho.com/api/v1';

    router.post('/create-checkout-session', async (req, res) => {
        if (!stripe) return res.status(503).json({ error: 'Payment service is currently unavailable.' });
        const { items, success_url, cancel_url, customer_email, metadata } = req.body;

        try {
            const shippingCost = calculateShippingCost(items);

            const line_items = [
                ...items.map((item) => ({
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: item.name,
                            images: item.image ? [item.image] : [],
                        },
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: item.quantity,
                })),
                {
                    price_data: {
                        currency: 'pln',
                        product_data: {
                            name: 'Wysyłka (InPost Paczkomat)',
                            description: 'Dostawa do wybranego paczkomatu',
                        },
                        unit_amount: Math.round(shippingCost * 100),
                    },
                    quantity: 1,
                }
            ];

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'blik', 'p24'],
                line_items,
                mode: 'payment',
                customer_email,
                success_url,
                cancel_url,
                metadata: {
                    ...metadata,
                    shipping_cost: shippingCost.toString()
                },
                shipping_address_collection: {
                    allowed_countries: ['PL'],
                },
            });

            res.json({ id: session.id, url: session.url });
        } catch (error) {
            console.error('Stripe Checkout Session Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
        if (!stripe) return res.status(503).send('Stripe not configured');
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook Signature Error:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Payment Successful. Creating Zoho Sales Order...');

            try {
                const token = await getAccessToken();
                const metadata = session.metadata;
                const cart = JSON.parse(metadata.cart);

                const zohoOrder = {
                    customer_id: process.env.ZOHO_GUEST_CUSTOMER_ID || 'GUEST_ID', // Ideal: map by email
                    date: new Date().toISOString().split('T')[0],
                    shipping_charge: parseFloat(metadata.shipping_cost),
                    line_items: cart.map((item) => ({
                        item_id: item.id,
                        quantity: item.q
                    })),
                    notes: `AUTO-ORDER: Paid via Stripe. 
Locker: ${metadata.paczkomatId}. 
Phone: ${metadata.phone}. 
Address: ${metadata.address}, ${metadata.city}.`,
                };

                const zohoRes = await fetch(`${apiBase}/salesorders?organization_id=${orgId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(zohoOrder)
                });

                const zohoData = await zohoRes.json();
                if (zohoRes.ok) {
                    console.log('Zoho Order Created:', zohoData.salesorder.salesorder_number);
                } else {
                    console.error('Zoho Order Creation Failed:', zohoData);
                }
            } catch (err) {
                console.error('Post-payment Zoho Sync Error:', err);
            }
        }

        res.json({ received: true });
    });

    return router;
}
