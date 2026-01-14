import { ColorTheme, TutorialStep } from './types';

export const COLORS: ColorTheme[] = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲', text: 'text-red-500' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', text: 'text-blue-500' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●', text: 'text-yellow-500' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■', text: 'text-green-500' }
];

// Fix: Added missing THEMES export required by QuizHome, App, QuizResults, etc.
export const THEMES: Record<string, { gradient: string; text: string }> = {
  classic: { gradient: 'from-indigo-600 to-purple-700', text: 'text-white' },
  light: { gradient: 'from-slate-50 to-white', text: 'text-slate-900' },
  dark: { gradient: 'from-slate-900 to-slate-800', text: 'text-white' },
  nature: { gradient: 'from-emerald-500 to-teal-700', text: 'text-white' },
  cyberpunk: { gradient: 'from-fuchsia-600 to-pink-700', text: 'text-white' },
  ocean: { gradient: 'from-blue-500 to-cyan-700', text: 'text-white' }
};

// Fix: Added missing TUTORIAL_STEPS export required by TutorialModal and TutorialWidget
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Quiviex",
    content: "The ultimate platform for creating, sharing, and mastering any topic. Let's take a quick tour.",
    highlight: null
  },
  {
    title: "AI Power",
    content: "You can generate entire quizzes using our AI assistant. Simply provide a topic or an image.",
    highlight: "ai-assistant",
    showTokenActions: true
  },
  {
    title: "Global Community",
    content: "Share your quizzes with the world or play modules created by other architects.",
    highlight: "community"
  }
];

// Fix: Added missing BANNED_WORDS export required by QuizCreator
export const BANNED_WORDS: string[] = [
  "spam", "offensive", "inappropriate"
];

// Fix: Added missing SOFT_FILTER_WORDS export required by QuizCreator
export const SOFT_FILTER_WORDS: string[] = [
  "sensitive", "mild"
];

// Fix: Added missing DEFAULT_MUSIC_TRACKS export required by MusicSelectionModal and PomodoroWidget
export const DEFAULT_MUSIC_TRACKS = [
  { id: 'none', label: 'No Music', url: '' },
  { id: 'lofi', label: 'Lofi Study', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'synthwave', label: 'Retro Synth', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'ambient', label: 'Deep Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
];