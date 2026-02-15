import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Node fetch test: say hi' }] }] }) });
    const j = await r.json();
    console.log('Fetch OK:', j.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

main().catch(e => console.error(e));