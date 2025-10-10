export type LevelTier = {
  minLevel: number;
  maxLevel: number;
  title: string;
  icon: string;
  color: string;
};

export const LEVEL_TIERS: LevelTier[] = [
  {
    minLevel: 1,
    maxLevel: 3,
    title: 'Beginner Dreamer',
    icon: '😴',
    color: '#6b7280',
  },
  {
    minLevel: 4,
    maxLevel: 6,
    title: 'Dream Explorer',
    icon: '🌙',
    color: '#3b82f6',
  },
  {
    minLevel: 7,
    maxLevel: 10,
    title: 'Lucid Apprentice',
    icon: '✨',
    color: '#8b5cf6',
  },
  {
    minLevel: 11,
    maxLevel: 15,
    title: 'Dream Master',
    icon: '💫',
    color: '#ec4899',
  },
  {
    minLevel: 16,
    maxLevel: 20,
    title: 'Lucid Legend',
    icon: '🌌',
    color: '#f59e0b',
  },
  {
    minLevel: 21,
    maxLevel: 999,
    title: 'Dream God',
    icon: '👑',
    color: '#eab308',
  },
];

export const XP_REWARDS = {
  DREAM_LOGGED: 10,
  LUCID_DREAM: 50,
  LESSON_COMPLETED: 25,
  STREAK_MILESTONE: 15,
};

export const calculateLevel = (xp: number): number => {
  let level = 1;
  let xpRequired = 100;
  let totalXpNeeded = 0;

  while (xp >= totalXpNeeded + xpRequired) {
    totalXpNeeded += xpRequired;
    level++;
    xpRequired += 50; // Each level requires 50 more XP
  }

  return level;
};

export const getXpForLevel = (level: number): number => {
  let xpRequired = 100;
  let totalXp = 0;

  for (let i = 1; i < level; i++) {
    totalXp += xpRequired;
    xpRequired += 50;
  }

  return totalXp;
};

export const getXpForNextLevel = (currentLevel: number): number => {
  return 100 + (currentLevel - 1) * 50;
};

export const getLevelTier = (level: number): LevelTier => {
  for (const tier of LEVEL_TIERS) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier;
    }
  }
  return LEVEL_TIERS[LEVEL_TIERS.length - 1]; // Default to highest tier
};

export const getProgressToNextLevel = (xp: number): { current: number; required: number; percentage: number } => {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  
  const currentXpInLevel = xp - xpForCurrentLevel;
  const percentage = (currentXpInLevel / xpForNextLevel) * 100;

  return {
    current: currentXpInLevel,
    required: xpForNextLevel,
    percentage: Math.min(percentage, 100),
  };
};
