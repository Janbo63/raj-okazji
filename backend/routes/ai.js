import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/advice', async (req, res) => {
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
            model: "gemini-1.5-flash",
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

export default router;
