import { Question, QuestionType } from '../types';

export const generateQuizWithGitHub = async (
  token: string, 
  topic: string, 
  difficulty: string, 
  count: number,
  quizType: string = 'mixed',
  model: string = 'gpt-4o-mini'
): Promise<{ title: string, questions: Question[] }> => {
  const endpoint = "https://models.inference.ai.azure.com/chat/completions";
  
  const prompt = `Generate a JSON quiz about ${topic}. Difficulty: ${difficulty}. Count: ${count}. Type: ${quizType}.
  Return JSON: {"title": "string", "questions": [{"type": "multiple-choice", "question": "string", "options": ["string"], "correctAnswer": number, "explanation": "string"}]}`;

  // Fix: Use window.fetch
  const response = await (window as any).fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Fix: Use window.localStorage
      "Authorization": `Bearer ${token || (window as any).localStorage.getItem('gh_models_token')}`
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a professional quiz generator. Output valid JSON only." },
        { role: "user", content: prompt }
      ],
      model: model,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    title: parsed.title,
    questions: parsed.questions.map((q: any) => ({
      ...q,
      image: '',
      timeLimit: 20
    }))
  };
};