import { Question, UserPreferences } from '../types';

/**
 * Standard REST implementation for GitHub Models Quiz Generation.
 */

export const generateQuizWithAI = async (
  topic: string, 
  difficulty: string, 
  count: number,
  prefs: UserPreferences | undefined,
  quizType: string = 'mixed'
): Promise<{ title: string, questions: Question[] }> => {
    
    const provider = prefs?.aiTextProvider || 'github';
    const token = provider === 'github' ? (prefs?.githubToken || '') : (prefs?.openaiKey || '');
    const model = prefs?.textModel || 'gpt-4o-mini';
    
    const endpoint = provider === 'github' 
        ? "https://models.github.ai/inference/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const prompt = `Generate a ${difficulty} quiz about ${topic} with ${count} questions. 
    The quiz type is ${quizType}. Provide the output as a JSON object with 'title' and 'questions' array. 
    Each question object must have 'question', 'options' (array of 4 strings), 'correctAnswer' (index 0-3), and 'explanation'.
    IMPORTANT SAFETY: Ensure all content is educational and safe for all ages. Strictly AVOID violence, weapons, drugs, hate speech, or explicit themes. Do not use words that could trigger safety filters.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: model,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "AI service rejected the request. Please check your token in AI Settings.");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

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