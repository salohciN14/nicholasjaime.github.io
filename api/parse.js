import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req, res) {
  // 1. Handle CORS Preflight Requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter text to parse.' });
    }

    // 2. Load Gemini 3.5 Flash Model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
      Analyze this input: "${text}"
      Return ONLY a valid JSON object matching this structure (no backticks, no extra text):
      {
        "assignments": ["list of items, or empty array"],
        "workouts": "summary of workout info or 'None'",
        "aiSummary": "short summary"
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    // 3. Clean up any accidental markdown from Gemini
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(responseText);

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Backend Error:', error);
    // Return status 200 even on error so Vercel doesn't crash with raw HTML
    return res.status(200).json({ 
      success: false, 
      error: error.message || 'Failed to process prompt with Gemini API.' 
    });
  }
}
