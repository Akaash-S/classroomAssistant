import axios from 'axios';

// Use the specific v1beta endpoint requested by the user
const API_KEY = process.env.GEMINI_API_KEY || '';
// Fallback to gemini-1.5-flash as it has more stable free-tier quotas than 2.0-flash for some API keys
const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const extractLectureData = async (transcript: string) => {
  console.log('[Gemini] Extracting data from transcript...');

  const prompt = `Analyze the following lecture transcript and extract key information in JSON format.
    
    Transcript:
    ${transcript}
    
    Return ONLY a JSON object with this structure:
    {
      "summary": "Short lecture summary",
      "key_points": ["point1", "point2"],
      "exam_notes": ["important definition", "formula"],
      "tasks": [
        {
          "title": "Assignment Title",
          "description": "Task description",
          "due_date": "YYYY-MM-DD",
          "subject": "Subject Name"
        }
      ]
    }`;

  try {
    const response = await axios.post(`${MODEL_URL}?key=${API_KEY}`, {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[Gemini] Empty response from API');
      return { summary: '', key_points: [], exam_notes: [], tasks: [] };
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error('[Gemini] JSON Parse Error:', parseErr, 'Raw Text:', text);
      return { summary: '', key_points: [], exam_notes: [], tasks: [] };
    }
  } catch (err: any) {
    const errorMsg = err?.response?.data?.error?.message || err.message || 'Unknown Gemini Error';
    console.error('[Gemini REST Error]', errorMsg);

    // Log full error details for debugging status 500
    if (err?.response?.data) {
      console.error('[Gemini REST Full Details]', JSON.stringify(err.response.data, null, 2));
    }

    throw new Error(`Gemini API failed: ${errorMsg}`);
  }
};
