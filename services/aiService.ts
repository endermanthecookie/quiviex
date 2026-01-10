import { Question, UserPreferences } from '../types';

/**
 * AI Services respecting 3 Protocols:
 * Mode 1: GH Text Only (Images disabled)
 * Mode 2: OAI Full (Text + DALL-E)
 * Mode 3: Hybrid (GH Text + OAI Images)
 */

const getAuthHeaders = (prefs: UserPreferences | undefined, type: 'text' | 'image') => {
    const mode = prefs?.aiMode || '1';
    let token = '';

    if (type === 'text') {
        const useOpenAI = mode === '2';
        token = useOpenAI ? (prefs?.openaiKey || '') : (prefs?.githubToken || '');
    } else {
        token = prefs?.openaiKey || '';
    }
    
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

const getEndpoint = (prefs: UserPreferences | undefined, type: 'text' | 'image') => {
    const mode = prefs?.aiMode || '1';
    if (type === 'text') {
        const useOpenAI = mode === '2';
        return useOpenAI 
            ? "https://api.openai.com/v1/chat/completions"
            : "https://models.github.ai/inference/chat/completions";
    } else {
        return "https://api.openai.com/v1/images/generations";
    }
};

export const generateQuizFromImage = async (imageBase64: string, difficulty: string, count: number, prefs: UserPreferences | undefined): Promise<{ title: string, questions: Question[] }> => {
    const headers = getAuthHeaders(prefs, 'text');
    const endpoint = getEndpoint(prefs, 'text');
    const mode = prefs?.aiMode || '1';
    const model = mode === '2' ? 'gpt-4o-mini' : 'gpt-4o-mini';

    const prompt = `Generate a ${difficulty} quiz with ${count} questions based on this image. 
    Return a JSON object with a 'title' and 'questions' array. 
    Each question should be multiple-choice with 4 'options', 'correctAnswer' index (0-3), and an 'explanation'.
    SAFETY: Ensure content is educational, PG-13, and free of violence, drugs, or hate speech.`;

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

    if (!response.ok) throw new Error("Visual analysis failed. Check API configuration for Mode " + mode);
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
    const mode = prefs?.aiMode || '1';
    if (mode === '1') return null; // Image generation disabled in Mode 1

    const headers = getAuthHeaders(prefs, 'image');
    const endpoint = getEndpoint(prefs, 'image');

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: "dall-e-2",
                prompt: `Educational illustration (Safe for work, no violence): ${text}`,
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

export const generateFocusSession = async (inputData: { mistakes: any[], recentTopics: string[] }, prefs: UserPreferences | undefined) => {
    const headers = getAuthHeaders(prefs, 'text');
    const endpoint = getEndpoint(prefs, 'text');
    const mode = prefs?.aiMode || '1';
    const model = mode === '2' ? 'gpt-4o-mini' : 'gpt-4o-mini';

    const prompt = `Analyze these mistakes: ${JSON.stringify(inputData.mistakes)} from topics: ${JSON.stringify(inputData.recentTopics)}.
    Provide 5 multiple-choice questions to address the weaknesses.
    Return JSON: {"analysis": "str", "questions": [{"question": "str", "options": ["str", "str", "str", "str"], "correctAnswer": 0, "explanation": "str"}]}
    SAFETY: Do not generate content that violates safety guidelines.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) throw new Error("AI provider error in Mode " + mode);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
};