import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  console.log('Using API key present?', !!apiKey);

  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: '', baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined } });

  try {
    console.log('Listing models via SDK...');
    const models = await ai.models.list();
    console.log('Models (SDK) returned:', Array.isArray(models) ? models.slice(0,5).map(m => m.name) : models);
  } catch (e: any) {
    console.error('SDK models.list() failed:', e);
  }

  try {
    console.log('Calling generateContent via SDK (text-bison-001)...');
    const resp = await ai.models.generateContent({ model: 'text-bison-001', contents: [{ role: 'user', parts: [{ text: 'Say hello and give 2+2' }] }] });
    console.log('generateContent response text:', resp.text?.slice(0,200));
  } catch (e: any) {
    console.error('SDK generateContent failed:', e?.toString?.() || e);
    if (e?.response) console.error('response:', e.response);
  }
}

main().catch(err => { console.error(err); process.exit(1); });