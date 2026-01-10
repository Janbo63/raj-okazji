
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getShoppingAdvice = async (query: string, lang: Language): Promise<string> => {
  const systemInstruction = lang === Language.PL 
    ? "Jesteś asystentem zakupowym w sklepie 'Raj Okazji'. Sklep sprzedaje zwroty z aukcji i nadwyżki z UK w cenach -50%. Pomagaj klientom wybierać okazje i odpowiadaj na pytania o model biznesowy (wysoka jakość, niska cena, sprawdzone produkty)."
    : "You are a shopping assistant for 'Raj Okazji'. We sell auction returns and UK liquidation stock at 50%+ discounts. Help customers find deals and explain our model (high quality, low price, quality-checked products).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || (lang === Language.PL ? "Przepraszam, nie mogłem przetworzyć zapytania." : "Sorry, I couldn't process your request.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return lang === Language.PL ? "Wystąpił błąd asystenta AI." : "AI Assistant error occurred.";
  }
};
