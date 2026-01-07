import { Question } from '../types';

// Access window to resolve "Cannot find name 'localStorage'"
const getOpenAIKey = () => (window as any).localStorage.getItem('openai_api_key') || '';
const getGitHubToken = () => (window as any).localStorage.getItem('gh_models_token') || '';

export const generateFocusSession = async (inputData: { mistakes: any[], recentTopics: string[] }) => {
  const ghToken = getGitHubToken();
  const openaiKey = getOpenAIKey();
  
  const token = ghToken || openaiKey;
  if (!token) {
    throw new Error("API Key required for Focus Mode analysis. Please add a GitHub Token or OpenAI Key in Settings.");
  }

  // Prioritize GitHub Inference API if token is present
  const endpoint = ghToken 
    ? "https://models.inference.ai.azure.com/chat/completions" 
    : "https://api.openai.com/v1/chat/completions";

  const { mistakes, recentTopics } = inputData;
  const prompt = mistakes.length > 0 
    ? `Analyze these recent quiz mistakes and generate 5 personalized study questions: ${JSON.stringify(mistakes.slice(0, 20))}`
    : `The user has perfect scores! Generate 5 challenging questions based on these topics: ${JSON.stringify(recentTopics.slice(0, 5))}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI tutor. Return a JSON object with 'analysis' (string) and 'questions' (array of {question, options, correctAnswer, explanation})." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return JSON.parse(data.choices[0].message.content);
};

export const generateQuizFromImage = async (imageBase64: string, difficulty: string, count: number): Promise<{ title: string, questions: Question[] }> => {
  const key = getOpenAIKey();
  if (!key) throw new Error("OpenAI API Key required for image analysis.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Generate a ${difficulty} difficulty quiz with ${count} questions based on this image. Return JSON with 'title' and 'questions' array.` },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title || "Visual Quiz",
    questions: (parsed.questions || []).map((q: any) => ({
      ...q,
      image: '',
      type: 'multiple-choice',
      timeLimit: 20
    }))
  };
};

export const generateImageForQuestion = async (text: string, model: string = 'dall-e-3'): Promise<string | null> => {
  const key = getOpenAIKey();
  if (!key) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        prompt: `Minimalist educational illustration for: "${text}". No text in image. High quality, clean vectors.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    const data = await response.json();
    if (data.error) return null;
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (e) {
    (window as any).console.error("DALL-E Error", e);
    return null;
  }
};