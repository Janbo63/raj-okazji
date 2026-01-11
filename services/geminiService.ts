import { Language } from "../types";

export const getShoppingAdvice = async (query: string, lang: Language): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lang }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error || (lang === Language.PL ? 'Wystąpił błąd asystenta AI.' : 'AI Assistant error occurred.');
    }
    const data = await res.json();
    return data.advice || (lang === Language.PL ? 'Przepraszam, nie mogłem przetworzyć zapytania.' : "Sorry, I couldn't process your request.");
  } catch (error) {
    console.error("Gemini Proxy Fetch Error:", error);
    return lang === Language.PL ? 'Wystąpił błąd asystenta AI.' : 'AI Assistant error occurred.';
  }
};
