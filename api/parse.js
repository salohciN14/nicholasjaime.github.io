import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method === 'OPTIONS' || req.method === 'GET') {
        return res.status(200).json({ status: 'active' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, history } = req.body;

        const prompt = `
You are an intelligent personal assistant dashboard engine.
Respond to the user naturally in the first person (chat).
Analyze the conversation and categorize any assignments or tasks mentioned.

User Input: "${text}"
Previous Context: ${JSON.stringify(history || [])}

Return STRICT JSON matching this exact structure:
{
  "reply": "Your natural, direct conversational reply to the user here.",
  "urgentTasks": ["Tasks due today/tomorrow or marked high priority"],
  "upcomingTasks": ["Tasks due later in the future"]
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        let cleanText = response.text || '{}';
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(cleanText);

        return res.status(200).json({
            success: true,
            data: parsedData
        });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}



