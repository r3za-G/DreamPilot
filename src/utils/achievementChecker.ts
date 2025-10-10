import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

type UserStats = {
  totalDreams: number;
  lucidDreams: number;
  currentStreak: number;
  completedLessons: number;
};

type AchievementData = {
  id: string;
  unlockedAt: string;
};

export const checkAchievements = async (
  userId: string,
  stats: UserStats
): Promise<Achievement[]> => {
  try {
    // Get user's current achievements with timestamps
    const achievementsDoc = await getDoc(doc(db, 'users', userId, 'data', 'achievements'));
    const existingData = achievementsDoc.exists() ? achievementsDoc.data() : {};
    const unlockedAchievements: AchievementData[] = existingData.achievements || [];
    const unlockedIds = unlockedAchievements.map(a => a.id);

    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedIds.includes(achievement.id)) continue;

      // Check if requirement is met
      let requirementMet = false;
      
      switch (achievement.requirement.type) {
        case 'dreams':
          requirementMet = stats.totalDreams >= achievement.requirement.count;
          break;
        case 'lucid_dreams':
          requirementMet = stats.lucidDreams >= achievement.requirement.count;
          break;
        case 'streak':
          requirementMet = stats.currentStreak >= achievement.requirement.count;
          break;
        case 'lessons':
          requirementMet = stats.completedLessons >= achievement.requirement.count;
          break;
      }

      // If requirement met, unlock achievement
      if (requirementMet) {
        newlyUnlocked.push(achievement);
        unlockedAchievements.push({
          id: achievement.id,
          unlockedAt: now,
        });
      }
    }

    // Save updated achievements
    if (newlyUnlocked.length > 0) {
      await setDoc(
        doc(db, 'users', userId, 'data', 'achievements'),
        {
          achievements: unlockedAchievements,
          lastChecked: now,
        }
      );
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

export const getRecentAchievements = async (userId: string, minutesAgo: number = 1): Promise<Achievement[]> => {
  try {
    const achievementsDoc = await getDoc(doc(db, 'users', userId, 'data', 'achievements'));
    if (!achievementsDoc.exists()) return [];

    const data = achievementsDoc.data();
    const unlockedAchievements: AchievementData[] = data.achievements || [];
    
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    
    const recentIds = unlockedAchievements
      .filter(a => a.unlockedAt > cutoffTime)
      .map(a => a.id);

    return ACHIEVEMENTS.filter(a => recentIds.includes(a.id));
  } catch (error) {
    console.error('Error getting recent achievements:', error);
    return [];
  }
};

export const getUnlockedAchievements = async (userId: string): Promise<string[]> => {
  try {
    const achievementsDoc = await getDoc(doc(db, 'users', userId, 'data', 'achievements'));
    if (!achievementsDoc.exists()) return [];
    
    const data = achievementsDoc.data();
    const unlockedAchievements: AchievementData[] = data.achievements || [];
    return unlockedAchievements.map(a => a.id);
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};
