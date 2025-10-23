export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: {
    type: 'dreams' | 'lucid_dreams' | 'streak' | 'lessons';
    count: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export const ACHIEVEMENTS: Achievement[] = [
  // Dream Milestones
  {
    id: 'first_dream',
    title: 'Dream Explorer',
    description: 'Log your first dream',
    icon: '📖',
    requirement: { type: 'dreams', count: 1 },
    rarity: 'common',
  },
  {
    id: 'dream_collector_10',
    title: 'Dream Collector',
    description: 'Log 10 dreams',
    icon: '📚',
    requirement: { type: 'dreams', count: 10 },
    rarity: 'common',
  },
  {
    id: 'dream_master_50',
    title: 'Dream Master',
    description: 'Log 50 dreams',
    icon: '🏆',
    requirement: { type: 'dreams', count: 50 },
    rarity: 'rare',
  },
  {
    id: 'dream_legend_100',
    title: 'Dream Legend',
    description: 'Log 100 dreams',
    icon: '👑',
    requirement: { type: 'dreams', count: 100 },
    rarity: 'epic',
  },

  // Lucid Dream Milestones
  {
    id: 'first_lucid',
    title: 'Awakened Dreamer',
    description: 'Experience your first lucid dream',
    icon: '✨',
    requirement: { type: 'lucid_dreams', count: 1 },
    rarity: 'rare',
  },
  {
    id: 'lucid_apprentice',
    title: 'Lucid Apprentice',
    description: 'Experience 5 lucid dreams',
    icon: '🌟',
    requirement: { type: 'lucid_dreams', count: 5 },
    rarity: 'rare',
  },
  {
    id: 'lucid_master',
    title: 'Lucid Master',
    description: 'Experience 20 lucid dreams',
    icon: '💫',
    requirement: { type: 'lucid_dreams', count: 20 },
    rarity: 'epic',
  },
  {
    id: 'lucid_legend',
    title: 'Lucid Legend',
    description: 'Experience 50 lucid dreams',
    icon: '🌌',
    requirement: { type: 'lucid_dreams', count: 50 },
    rarity: 'legendary',
  },

  // Streak Milestones
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    requirement: { type: 'streak', count: 3 },
    rarity: 'common',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    requirement: { type: 'streak', count: 7 },
    rarity: 'common',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🎯',
    requirement: { type: 'streak', count: 30 },
    rarity: 'rare',
  },
  {
    id: 'streak_100',
    title: 'Centurion',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    requirement: { type: 'streak', count: 100 },
    rarity: 'epic',
  },
  {
    id: 'streak_365',
    title: 'Year of Dreams',
    description: 'Maintain a 365-day streak',
    icon: '🏅',
    requirement: { type: 'streak', count: 365 },
    rarity: 'legendary',
  },

  // Lesson Milestones
  {
    id: 'first_lesson',
    title: 'Student',
    description: 'Complete your first lesson',
    icon: '📝',
    requirement: { type: 'lessons', count: 1 },
    rarity: 'common',
  },
  {
    id: 'lesson_master',
    title: 'Graduated',
    description: 'Complete all lessons',
    icon: '🎓',
    requirement: { type: 'lessons', count: 20 },
    rarity: 'rare',
  },
];
