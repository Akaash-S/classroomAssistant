import axios from 'axios';

// Groq API Configuration
const API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const extractLectureData = async (transcript: string) => {
  console.log('[Groq] Extracting data using Llama-3.3-70b...');

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
    const response = await axios.post(GROQ_URL, {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an educational assistant that extracts structured data from lecture transcripts. You must ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more consistent extraction
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[Groq] Empty response from API');
      return { summary: '', key_points: [], exam_notes: [], tasks: [] };
    }

    try {
      return JSON.parse(content);
    } catch (parseErr) {
      console.error('[Groq] JSON Parse Error:', parseErr, 'Raw Content:', content);
      return { summary: '', key_points: [], exam_notes: [], tasks: [] };
    }
  } catch (err: any) {
    const errorMsg = err?.response?.data?.error?.message || err.message || 'Unknown Groq Error';
    console.error('[Groq API Error]', errorMsg);

    if (err?.response?.data) {
      console.error('[Groq API Full Details]', JSON.stringify(err.response.data, null, 2));
    }

    throw new Error(`Groq API failed: ${errorMsg}`);
  }
};
