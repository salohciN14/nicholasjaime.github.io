export default async function handler(req, res) {
    // Set CORS headers so index.html can communicate with Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = req.body || {};

    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not configured in Vercel.' });
    }

    try {
        const prompt = `You are a personal dashboard backend parser. 
Analyze the input text and organize it into JSON matching this exact structure:
{
  "assignments": ["list of tasks or empty array if none mentioned"],
  "workouts": "summary of workout/recovery mentioned or empty string if none",
  "aiSummary": "1-2 sentence quick status response acknowledging input"
}

Input Text: "${text}"

Respond strictly with valid JSON only. Do not wrap in markdown code blocks.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini API Error');
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedJson);

        return res.status(200).json({ success: true, data: parsedData });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
