import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req, res) {
  // CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body || {};
    
    if (!text || !text.trim()) {
      return res.status(200).json({ success: false, error: 'Please enter text to parse.' });
    }

    // Using the active, supported Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `Analyze this input: "${text}"
      Return ONLY valid JSON (no markdown, no backticks) matching this exact structure:
      {
        "assignments": ["list of items, or empty array"],
        "workouts": "summary of workout info or 'None'",
        "aiSummary": "short summary"
      }`;

    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    // Clean up potential markdown blocks
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ success: true, data: JSON.parse(responseText) });

  } catch (error) {
    console.error('Backend Error:', error);
    // Force a 200 OK status but return the error inside the JSON so the frontend handles it cleanly
    return res.status(200).json({ 
      success: false, 
      error: 'API Error: ' + error.message 
    });
  }
}
