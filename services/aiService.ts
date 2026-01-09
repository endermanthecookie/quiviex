
import { Question, UserPreferences } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI Services implemented using standard @google/genai SDK.
 */

export const generateFocusSession = async (inputData: { mistakes: any[], recentTopics: string[] }, prefs: UserPreferences | undefined) => {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Analyze these quiz mistakes: ${JSON.stringify(inputData.mistakes)} from these topics: ${JSON.stringify(inputData.recentTopics)}.
    Provide a short analytical encouraging message (one sentence) and 5 multiple-choice questions to address the weaknesses.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswer", "explanation"]
                        }
                    }
                },
                required: ["analysis", "questions"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("AI provider returned empty response.");
    return JSON.parse(text);
};

export const generateQuizFromImage = async (imageBase64: string, difficulty: string, count: number, prefs: UserPreferences | undefined): Promise<{ title: string, questions: Question[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extract base64 data from data URI if present
    const base64Data = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
    
    const imagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: base64Data,
        },
    };
    
    const prompt = `Generate a ${difficulty} quiz with ${count} questions based on this image. 
    Return a JSON object with a 'title' and 'questions' array. 
    Each question should be multiple-choice with 4 'options', 'correctAnswer' index (0-3), and an 'explanation'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
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
    if (!text) throw new Error("Visual analysis failed.");
    const result = JSON.parse(text);

    return {
        title: result.title || "Image Quiz",
        questions: (result.questions || []).map((q: any) => ({
            ...q,
            image: '',
            type: 'multiple-choice',
            timeLimit: 20
        }))
    };
};

export const generateImageForQuestion = async (text: string, prefs: UserPreferences | undefined): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `A clear educational illustration for: ${text}`,
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            },
        });

        // Find the image part in the response
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};
