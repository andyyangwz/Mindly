import { theme } from "../theme";

export const mockJournals = [
  { id: "1", date: "2026-03-27", title: "Breakthrough in Calculus", preview: "Had a productive day studying calculus. Finally understood derivatives!", content: "<h3>Morning Study Session</h3><p>Finally understood derivatives after weeks of struggle! The concept of instantaneous rate of change finally clicked. Spent 3 hours in deep work mode.</p><p>Feeling accomplished and motivated to keep going.</p>", emojis: ["📚", "✨", "😊"], isFavorite: true, isPinned: true, allowAI: true },
  { id: "2", date: "2026-03-25", title: "Team Meeting Reflections", preview: "Had a great sync with the team. We aligned on the project roadmap.", content: "<h3>Team Sync</h3><p>Great meeting today. Everyone is aligned on the roadmap for Q2. My presentation went well and the team gave positive feedback.</p>", emojis: ["🤝", "💡", "🚀"], isFavorite: false, isPinned: false, allowAI: false },
  { id: "3", date: "2026-03-22", title: "Feeling Overwhelmed", preview: "Too many tasks, not enough time. Need to prioritize better.", content: "<h3>Stress & Overwhelm</h3><p>I woke up feeling overwhelmed today. There's so much on my plate. I need to learn to say no and prioritize ruthlessly.</p>", emojis: ["😰", "💭", "🌿"], isFavorite: false, isPinned: false, allowAI: true },
];

export const chatSessions = [
  { id: "1", title: "Feeling Overwhelmed", preview: "I've been thinking about what I wrote...", timestamp: new Date() },
  { id: "2", title: "Career Anxiety", preview: "I'm worried about my career path...", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", title: "Sleep Issues", preview: "I haven't been sleeping well lately...", timestamp: new Date(Date.now() - 172800000) },
];

export const initialMessages = [
  { id: "1", text: "I'm here to listen. Want to spill what's on your mind?", isUser: false },
  { id: "2", text: "I've been thinking about what I wrote this morning...", isUser: true },
  { id: "3", text: "I can see you're carrying a lot right now. What stood out to you most when you re-read what you wrote?", isUser: false },
  { id: "4", text: "The part about 'spreading myself too thin'... I keep saying yes because I'm afraid of letting people down.", isUser: true },
  { id: "5", text: "I hear you, and what you're feeling is deeply valid. Trying to be everything for everyone is exhausting. The feeling of being 'spread too thin' isn't a weakness—it's your mind sending you an honest signal.\n\nHere's a small step: Choose one thing you can let go of or delegate this week. What might that be?", isUser: false },
];

export const insightData = {
  weekly: [
    { day: "Mon", studyTime: 4.5, productivity: 75, focus: 85 },
    { day: "Tue", studyTime: 6, productivity: 82, focus: 90 },
    { day: "Wed", studyTime: 5.5, productivity: 78, focus: 88 },
    { day: "Thu", studyTime: 7, productivity: 88, focus: 92 },
    { day: "Fri", studyTime: 4, productivity: 70, focus: 75 },
    { day: "Sat", studyTime: 3, productivity: 65, focus: 70 },
    { day: "Sun", studyTime: 5, productivity: 80, focus: 82 },
  ],
  monthly: [
    { day: "Wk1", studyTime: 28, productivity: 72, focus: 78 },
    { day: "Wk2", studyTime: 32, productivity: 78, focus: 85 },
    { day: "Wk3", studyTime: 30, productivity: 75, focus: 80 },
    { day: "Wk4", studyTime: 35, productivity: 85, focus: 88 },
  ],
};

export const timeDistData = [
  { name: "Studying", value: 42, color: theme.primary },
  { name: "Social", value: 18, color: theme.secondary },
  { name: "Entertainment", value: 22, color: theme.accent },
  { name: "Rest", value: 18, color: "#F59E0B" },
];
