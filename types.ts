
export type QuestionType = 'multiple-choice' | 'true-false' | 'text-input' | 'ordering' | 'fill-in-the-blank' | 'matching' | 'slider';
export type QuizVisibility = 'public' | 'unlisted' | 'private';

export interface UserStats {
  quizzesCreated: number;
  quizzesPlayed: number;
  questionsAnswered: number;
  perfectScores: number;
  studySessions: number;
  aiQuizzesGenerated: number;
  aiImagesGenerated: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  req_type: keyof UserStats;
  req_value: number;
  category?: string;
}

export interface UserPreferences {
  textModel?: string;
  imageModel?: string;
  githubToken?: string;
  openaiKey?: string;
  aiTextProvider?: 'github' | 'openai';
  aiImageProvider?: 'github' | 'openai';
  appFont?: string;
  appTheme?: string;
  customThemeData?: CustomTheme; 
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  password?: string;
  hasSeenTutorial?: boolean;
  stats: UserStats;
  achievements: string[]; 
  history: QuizResult[];
  preferences?: UserPreferences;
  savedQuizIds: number[]; 
}

export interface Feedback {
    id: string;
    userId: string;
    username: string;
    type: 'bug' | 'suggestion' | 'other';
    content: string;
    date: string;
    status: 'new' | 'read' | 'resolved';
    adminReply?: string;
}

export interface Question {
  question: string;
  image: string;
  type: QuestionType;
  options: string[];
  correctAnswer: number | string | null; 
  timeLimit: number;
  explanation?: string;
}

export interface CustomTheme {
  background: string; 
  backgroundImage?: string; 
  text: string;    
  accent: string;  
  cardColor: string; 
  cardOpacity: number; 
}

export interface Quiz {
  id: number;
  userId: string;
  title: string;
  questions: Question[];
  createdAt: string;
  theme?: string;
  customTheme?: CustomTheme;
  shuffleQuestions?: boolean;
  backgroundMusic?: string; 
  visibility?: QuizVisibility; 
  creatorUsername?: string;
  creatorAvatarUrl?: string;
  stats?: {
    views: number;
    plays: number;
    avgRating: number;
    totalRatings: number;
  };
}

export interface QuizResult {
  id: string; 
  quizId: number;
  quizTitle: string;
  date: string;
  score: number;
  totalQuestions: number;
  answers: (number | string | number[])[]; 
}

export interface ColorTheme {
  bg: string;
  hover: string;
  icon: string;
  text: string;
}

export interface TutorialStep {
  title: string;
  content: string;
  highlight: string | null;
  showTokenActions?: boolean;
}

export interface Comment {
  id: string;
  quizId: number;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  parentId?: string | null; 
  replies?: Comment[]; 
}

export interface Rating {
  quizId: number;
  userId: string;
  rating: number; 
}