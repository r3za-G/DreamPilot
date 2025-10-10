import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { XP_REWARDS, calculateLevel } from '../data/levels';

export const awardXP = async (
  userId: string,
  amount: number,
  reason: string
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean; previousLevel: number }> => {
  try {
    const userXpDoc = doc(db, 'users', userId, 'data', 'xp');
    const xpData = await getDoc(userXpDoc);

    let currentXP = 0;
    if (xpData.exists()) {
      currentXP = xpData.data().total || 0;
    }

    const previousLevel = calculateLevel(currentXP);
    const newXP = currentXP + amount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > previousLevel;

    // Save XP data
    await setDoc(
      userXpDoc,
      {
        total: newXP,
        lastAwarded: new Date().toISOString(),
        lastReason: reason,
      },
      { merge: true }
    );

    // Log XP history
    const historyDoc = doc(db, 'users', userId, 'xpHistory', Date.now().toString());
    await setDoc(historyDoc, {
      amount,
      reason,
      timestamp: new Date().toISOString(),
      totalAfter: newXP,
    });

    return {
      newXP,
      newLevel,
      leveledUp,
      previousLevel,
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return {
      newXP: 0,
      newLevel: 1,
      leveledUp: false,
      previousLevel: 1,
    };
  }
};

export const getUserXP = async (userId: string): Promise<number> => {
  try {
    const userXpDoc = doc(db, 'users', userId, 'data', 'xp');
    const xpData = await getDoc(userXpDoc);
    return xpData.exists() ? xpData.data().total || 0 : 0;
  } catch (error) {
    console.error('Error getting user XP:', error);
    return 0;
  }
};
