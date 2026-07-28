import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // 1. Check for API key safely inside the function
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ success: false, error: 'Missing GEMINI_API_KEY in Vercel settings.' });
    }

    // 2. Initialize inside the try/catch so it can't crash the server
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const { text } = req.body || {};
    
    if (!text || !text.trim()) {
      return res.status(200).json({ success: false, error: 'Please enter text to parse.' });
    }

    const prompt = `Analyze this input: "${text}"
      Return ONLY valid JSON (no markdown, no backticks) matching this exact structure:
      {
        "assignments": ["list of items, or empty array"],
        "workouts": "summary of workout info or 'None'",
        "aiSummary": "short summary"
      }`;

    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ success: true, data: JSON.parse(responseText) });

  } catch (error) {
    console.error('Backend Error:', error);
    return res.status(200).json({ 
      success: false, 
      error: 'API Error: ' + error.message 
    });
  }
}
