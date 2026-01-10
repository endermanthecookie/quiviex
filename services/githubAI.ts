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

    const typeInstruction = quizType === 'mixed' 
        ? "Use a variety of these types: multiple-choice, true-false, fill-in-the-blank, ordering, matching, text-input, slider."
        : `Use only the '${quizType}' question type.`;

    const prompt = `Generate a ${difficulty} quiz about "${topic}" with ${count} questions.
    ${typeInstruction}
    
    Output a JSON object with this structure:
    {
      "title": "Quiz Title",
      "questions": [
        {
          "type": "string",
          "question": "string",
          "options": ["string", ...],
          "correctAnswer": "mixed",
          "explanation": "string"
        }
      ]
    }

    Schema Rules by Type:
    1. multiple-choice: 'options' has 4 strings. 'correctAnswer' is index (0-3).
    2. true-false: 'options' is ["True", "False"]. 'correctAnswer' is index (0 or 1).
    3. ordering: 'options' has 4 items in CORRECT sequence. 'correctAnswer' is null.
    4. matching: 'options' has 8 strings representing 4 pairs: [Key1, Value1, Key2, Value2, Key3, Value3, Key4, Value4]. 'correctAnswer' is null.
    5. fill-in-the-blank: 'question' text must contain "[ ]" as placeholder. 'options' has 4 strings (1 correct, 3 distractors). 'correctAnswer' is the index of the correct string in options.
    6. text-input: 'options' is []. 'correctAnswer' is the correct string answer.
    7. slider: 'options' is ["min", "max", "step", "unit_label"]. 'correctAnswer' is the target number.

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
            type: ['multiple-choice', 'true-false', 'text-input', 'ordering', 'matching', 'slider', 'fill-in-the-blank'].includes(q.type) ? q.type : 'multiple-choice',
            timeLimit: 20,
            options: q.options || [],
            correctAnswer: q.correctAnswer
        }))
    };
};