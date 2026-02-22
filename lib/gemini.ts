import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export const extractLectureData = async (transcript: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following lecture transcript and extract key information in JSON format.
    
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
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          exam_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                due_date: { type: Type.STRING },
                subject: { type: Type.STRING }
              },
              required: ["title", "description", "due_date", "subject"]
            }
          }
        },
        required: ["summary", "key_points", "exam_notes", "tasks"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
