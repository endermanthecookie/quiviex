import { Question, UserPreferences } from '../types';

export const generateQuizWithAI = async (
  topic: string, 
  difficulty: string, 
  count: number,
  prefs: UserPreferences | undefined,
  quizType: string = 'mixed'
): Promise<{ title: string, questions: Question[] }> => {
  
    const provider = prefs?.aiTextProvider || 'github';
    const token = provider === 'github' ? (prefs?.githubToken || '') : (prefs?.openaiKey || '');
    const model = prefs?.textModel || (provider === 'github' ? 'gpt-4o-mini' : 'gpt-4o-mini');
    const endpoint = provider === 'github' 
        ? "https://models.github.ai/inference/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    if (!token) throw new Error(`Missing ${provider === 'github' ? 'GitHub Token' : 'OpenAI Key'}. Please check settings.`);

    const prompt = `Generate a ${difficulty} quiz about ${topic} with ${count} questions. The quiz type is ${quizType}. Provide the output as a JSON object with 'title' and 'questions' array. Each question object must have 'question', 'options' (array of strings), 'correctAnswer' (index integer), and 'explanation'.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`AI Request failed: ${errData.error?.message || response.statusText}`);
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