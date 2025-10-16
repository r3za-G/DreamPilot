import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { calculateLevel } from "../data/levels";

export const awardXP = async (
  userId: string,
  xpAmount: number,
  reason: string
): Promise<{ leveledUp: boolean; newLevel?: number; oldLevel?: number }> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("User document not found");
      return { leveledUp: false };
    }

    const userData = userDoc.data();
    const currentTotalXP = userData.totalXP || 0;
    const oldLevel = calculateLevel(currentTotalXP);
    const newTotalXP = currentTotalXP + xpAmount;
    const newLevel = calculateLevel(newTotalXP);

    const leveledUp = newLevel > oldLevel;

    // Update user document
    await updateDoc(userRef, {
      totalXP: newTotalXP,
      level: newLevel,
    });

    // Log XP history (optional but recommended)
    try {
      const xpHistoryRef = doc(
        db,
        "users",
        userId,
        "xpHistory",
        Date.now().toString()
      );
      await setDoc(xpHistoryRef, {
        amount: xpAmount,
        reason,
        timestamp: new Date().toISOString(),
        totalXP: newTotalXP,
        level: newLevel,
      });
    } catch (historyError) {
      console.error("Error logging XP history:", historyError);
      // Don't fail the whole operation if history fails
    }

    console.log(`✅ Awarded ${xpAmount} XP. Level: ${oldLevel} → ${newLevel}`);

    return {
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      oldLevel,
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return { leveledUp: false };
  }
};

export const getUserXP = async (userId: string): Promise<number> => {
  try {
    const userXpDoc = doc(db, "users", userId, "data", "xp");
    const xpData = await getDoc(userXpDoc);
    return xpData.exists() ? xpData.data().total || 0 : 0;
  } catch (error) {
    console.error("Error getting user XP:", error);
    return 0;
  }
};
