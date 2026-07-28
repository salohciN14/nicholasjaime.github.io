import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your secret API key from Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 1. Handle CORS Preflight Requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS header for standard POST requests
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Reject non-POST methods
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'No text input provided.' });
    }

    // 2. Load the Flash Model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 3. Prompt for strict JSON formatting
    const prompt = `
      You are an AI assistant parsing user notes into structured data.
      Analyze the following input: "${text}"

      Respond STRICTLY with a valid JSON object (no markdown, no backticks) using this exact structure:
      {
        "assignments": ["list of tasks or assignments found, or empty array if none"],
        "workouts": "summary of workout/exercise notes, or 'None'",
        "aiSummary": "brief summary of the user input"
      }
    `;

    // 4. Generate content from Gemini
    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    // Clean up any potential markdown formatting backticks from the AI string
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // 5. Parse JSON and return to frontend
    const data = JSON.parse(responseText);

    return res.status(200).json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);

    // Return exact error message so the toast banner on your frontend can display it
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
