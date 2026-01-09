
import { Question, UserPreferences } from '../types';

const getAuthHeaders = (prefs: UserPreferences | undefined, mode: 'text' | 'image') => {
    const provider = mode === 'text' ? (prefs?.aiTextProvider || 'github') : (prefs?.aiImageProvider || 'openai');
    const token = provider === 'github' ? (prefs?.githubToken || '') : (prefs?.openaiKey || '');
    
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

const getEndpoint = (prefs: UserPreferences | undefined, mode: 'text' | 'image') => {
    const provider = mode === 'text' ? (prefs?.aiTextProvider || 'github') : (prefs?.aiImageProvider || 'openai');
    if (mode === 'text') {
        return provider === 'github' 
            ? "https://models.github.ai/inference/chat/completions"
            : "https://api.openai.com/v1/chat/completions";
    } else {
        return "https://api.openai.com/v1/images/generations";
    }
};

export const generateFocusSession = async (inputData: { mistakes: any[], recentTopics: string[] }, prefs: UserPreferences | undefined) => {
    const headers = getAuthHeaders(prefs, 'text');
    const endpoint = getEndpoint(prefs, 'text');
    const model = prefs?.textModel || 'gpt-4o-mini';

    const prompt = `Analyze these quiz mistakes: ${JSON.stringify(inputData.mistakes)} from these topics: ${JSON.stringify(inputData.recentTopics)}.
    Provide a short analytical encouraging message (one sentence) and 5 multiple-choice questions to address the weaknesses.
    Return STRICT JSON object: {"analysis": "string", "questions": [{"question": "str", "options": ["str", "str", "str", "str"], "correctAnswer": 0, "explanation": "str"}]}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: model,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) throw new Error("AI provider rejected the request. Check your API key.");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
};

export const generateQuizFromImage = async (imageBase64: string, difficulty: string, count: number, prefs: UserPreferences | undefined): Promise<{ title: string, questions: Question[] }> => {
    const headers = getAuthHeaders(prefs, 'text');
    const endpoint = getEndpoint(prefs, 'text');
    const model = 'gpt-4o-mini'; 

    const prompt = `Generate a ${difficulty} quiz with ${count} questions based on this image. 
    Return a JSON object with a 'title' and 'questions' array. 
    Each question should be multiple-choice with 4 'options', 'correctAnswer' index (0-3), and an 'explanation'.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageBase64 } }
                    ]
                }
            ],
            model,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) throw new Error("Visual analysis failed. Check API key.");
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

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
    const provider = prefs?.aiImageProvider || 'openai';
    if (provider === 'github') return null; 

    const headers = getAuthHeaders(prefs, 'image');
    const endpoint = getEndpoint(prefs, 'image');

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `A clear educational illustration for: ${text}`,
                n: 1,
                size: "1024x1024"
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.data[0].url;
    } catch (e) {
        return null;
    }
};
