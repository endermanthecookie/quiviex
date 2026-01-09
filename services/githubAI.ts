
import { Question, UserPreferences } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// Updated to use Google Gemini API for high-quality quiz generation
export const generateQuizWithAI = async (
  topic: string, 
  difficulty: string, 
  count: number,
  prefs: UserPreferences | undefined,
  quizType: string = 'mixed'
): Promise<{ title: string, questions: Question[] }> => {
    
    // Create a fresh instance of Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Generate a ${difficulty} quiz about ${topic} with ${count} questions. The quiz type is ${quizType}. Provide the output as a JSON object with 'title' and 'questions' array. Each question object must have 'question', 'options' (array of strings), 'correctAnswer' (index integer), and 'explanation'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the generated quiz" },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { 
                                    type: Type.ARRAY, 
                                    items: { type: Type.STRING },
                                    minItems: 4,
                                    maxItems: 4
                                },
                                correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
                                explanation: { type: Type.STRING, description: "Detailed reasoning for the correct answer" }
                            },
                            required: ["question", "options", "correctAnswer", "explanation"]
                        }
                    }
                },
                required: ["title", "questions"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("AI Request failed: The model returned an empty response.");
    
    const result = JSON.parse(text);

    return {
        title: result.title || "New AI Quiz",
        questions: (result.questions || []).map((q: any) => ({
            ...q,
            image: '',
            type: 'multiple-choice',
            timeLimit: 20
        }))
    };
};
