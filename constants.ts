import { ColorTheme, TutorialStep } from './types';

export const COLORS: ColorTheme[] = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲', text: 'text-red-500' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', text: 'text-blue-500' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●', text: 'text-yellow-500' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■', text: 'text-green-500' }
];

export const BANNED_WORDS = [
    "rape", "rapist", "r*pist", "incest",
"terrorism", "terrorist",
"genocide", "massacre",
"suicide", "suicidal", "selfharm",
"childporn", "cp",

"kill", "killing", "killer",
"murder", "murdered", "murdering",
"attack", "assault", "beat", "beating",
"weapon", "gun", "knife", "stabbing",
"shoot", "shooting",
"war", "bomb", "bombing", "explosion",

"hate", "hatred", "hateful",
"racist", "racism",
"sexist", "sexism",
"homophobic", "transphobic",
"discrimination", "discriminate",
"bully", "bullying",
"harass", "harassment",
"threat", "threaten",
"slur", "bigot", "bigotry",

"drug", "drugs",
"cocaine", "heroin", "meth", "fentanyl",
"weed", "marijuana", "cannabis",
"lsd", "ecstasy",
"alcohol", "drunk",
"vape", "vaping",
"cigarette", "smoking",
"overdose", "addiction", "addicted",

"sexual", "sexually",
"nude", "nudity", "naked",
"adult", "suggestive", "seductive"
];

export const SOFT_FILTER_WORDS = [
    "dead", "death", "die", "dying",
    "blood", "bloody",
    "cut", "cutting",
    "mock", "insult",
    "fake", "scam",
    "hack", "hacking", "hacked",
    "lie", "lying", "liar",
    "misinformation", "disinformation",
    "copyrighted", "stolen", "stealing",
    "spam", "spamming",
    "clickbait",
    "nsfw"
];

export const AI_MODELS = {
  text: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
    { id: 'gpt-4o', name: 'GPT-4o (Smartest)' }
  ],
  image: [
    { id: 'dall-e-2', name: 'DALL-E 2 (Standard)' },
    { id: 'black-forest-labs-flux-pro', name: 'Flux Pro (Photoreal)' }
  ],
  providers: [
    { id: 'github', name: 'GitHub Models' },
    { id: 'openai', name: 'OpenAI API' }
  ]
};

export const FONT_NAMES: Record<string, string> = {
  'QuiviexCustom': 'Quiviex Default',
  'Font1': 'Signature Script',
  'Font2': 'Modern Sans',
  'Font3': 'Geometric Heavy',
  'Font4': 'Elegant Serif',
  'Font5': 'Futuristic Mono',
  'Font6': 'Soft Display',
  'Font7': 'Branding Sans',
  'Font8': 'Editorial Serif',
  'Font9': 'Comic Friendly',
  'Font10': 'High Contrast',
  'Font11': 'System Grotesk',
  'Font12': 'Retro Display',
  'Font13': 'Minimalist',
  'Font14': 'Tech Inline',
  'Font15': 'Stencil Bold',
  'Font16': 'Handwritten Note'
};

export const THEMES: Record<string, { label: string; gradient: string; text: string; accent: string }> = {
  light: {
    label: 'Daylight',
    gradient: 'from-slate-100 via-slate-200 to-slate-300',
    text: 'text-slate-900',
    accent: 'bg-violet-600'
  },
  classic: { 
    label: 'Classic Red', 
    gradient: 'from-red-600 to-red-900', 
    text: 'text-white',
    accent: 'bg-red-500'
  },
  cyberpunk: { 
    label: 'Cyberpunk', 
    gradient: 'from-slate-900 via-purple-900 to-slate-900', 
    text: 'text-cyan-400',
    accent: 'bg-cyan-500'
  },
  nature: { 
    label: 'Forest', 
    gradient: 'from-emerald-800 to-teal-900', 
    text: 'text-emerald-50',
    accent: 'bg-emerald-500'
  },
  ocean: { 
    label: 'Deep Sea', 
    gradient: 'from-blue-900 via-indigo-900 to-slate-900', 
    text: 'text-blue-100',
    accent: 'bg-blue-500'
  },
  winter: {
    label: 'Winter Frost',
    gradient: 'from-cyan-50 via-blue-100 to-indigo-200', 
    text: 'text-slate-800',
    accent: 'bg-cyan-600'
  }
};

export const DEFAULT_MUSIC_TRACKS = [
  { id: 'none', label: 'No Music', url: '' },
  { id: 'chill', label: 'Chill Lo-Fi', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3' },
  { id: 'upbeat', label: 'Upbeat Pop', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=upbeat-1-29008.mp3' },
  { id: 'suspense', label: 'Clockwork Tension', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_0782fa9838.mp3?filename=clockwork-104975.mp3' },
  { id: 'epic', label: 'Epic Battle', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_5502c40c81.mp3?filename=action-rock-124971.mp3' }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Quiviex! 🚀",
    content: "Master the art of quiz creation with our powerful AI tools powered by GitHub Models or OpenAI.",
    highlight: null
  },
  {
    title: "Step 1: AI Power 🤖",
    content: "Generate whole quizzes from just a topic or an image using state-of-the-art LLMs.",
    highlight: null,
    showTokenActions: true
  },
  {
    title: "Step 2: Quiz Metadata",
    content: "Start by giving your quiz a catchy Title. Enable 'Shuffle Questions' to randomize the order.",
    highlight: "title"
  },
  {
    title: "Step 3: Question Types",
    content: "Select from 7 powerful types including Matching, Slider, and Fill-in-the-Blank.",
    highlight: "type"
  },
  {
    title: "Step 4: Media Content",
    content: "Use 'Add Media' to upload visuals or use AI to generate custom art with DALL-E.",
    highlight: "question"
  },
  {
    title: "Step 5: Logic & Explanations",
    content: "Add explanations to help learners understand the 'why' behind correct answers.",
    highlight: "explanation"
  },
  {
    title: "Step 6: Publishing",
    content: "Once ready, click Save. You can keep it private or share it with the Quiviex Community!",
    highlight: "save"
  }
];