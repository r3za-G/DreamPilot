import {httpsCallable} from "firebase/functions";
import {functions, db, auth} from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// ✅ Export the type
export type DreamAnalysis = {
  dreamSigns: string[];
  themes: string[];
  emotions: string[];
  lucidityPotential: "low" | "medium" | "high";
  insights: string;
  suggestions: string[];
  analyzedAt: string;
};

interface AnalyzeDreamResponse {
  success: boolean;
  analysis: DreamAnalysis;
}

// ✅ Cloud Function for AI analysis
export const analyzeDreamWithAI = async (
  dreamText: string,
  dreamTitle: string,
  isLucid?: boolean
): Promise<DreamAnalysis | null> => {
  if (!dreamText || dreamText.trim().length < 10) {
    console.warn("⚠️ Dream text too short");
    return null;
  }

  try {
    console.log("🔮 Analyzing dream with Cloud Function...");

    const analyzeDream = httpsCallable<
      {dreamText: string; dreamTitle: string; isLucid?: boolean},
      AnalyzeDreamResponse
    >(functions, "analyzeDream");

    const result = await analyzeDream({
      dreamText,
      dreamTitle,
      isLucid,
    });

    if (result.data.success && result.data.analysis) {
      return result.data.analysis;
    }

    return null;
  } catch (error: any) {
    console.error("❌ Error calling Cloud Function:", error);

    if (error.code === "unauthenticated") {
      throw new Error("You must be logged in to analyze dreams");
    }

    return null;
  }
};

// ✅ Save dream analysis to Firebase
export const saveDreamAnalysis = async (
  userId: string,
  dreamId: string,
  analysis: DreamAnalysis
): Promise<void> => {
  try {
    console.log("💾 Saving analysis to dream:", dreamId);

    const dreamRef = doc(db, "dreams", dreamId);

    await setDoc(
      dreamRef,
      {
        analysis: analysis,
        analyzed: true,
        analyzedAt: analysis.analyzedAt,
      },
      {merge: true}
    );

    console.log("✅ Dream analysis saved");

    // Update user's dream patterns
    await updateUserDreamPatterns(userId, analysis);
  } catch (error) {
    console.error("❌ Error saving dream analysis:", error);
    throw error;
  }
};

// ✅ Update user dream patterns
const updateUserDreamPatterns = async (
  userId: string,
  analysis: DreamAnalysis
): Promise<void> => {
  try {
    const patternsDoc = doc(db, "users", userId, "data", "dreamPatterns");
    const existingPatterns = await getDoc(patternsDoc);

    let patterns: {[key: string]: number} = {};
    let themeCount: {[key: string]: number} = {};
    let emotionCount: {[key: string]: number} = {};

    if (existingPatterns.exists()) {
      const data = existingPatterns.data();
      patterns = data.dreamSigns || {};
      themeCount = data.themes || {};
      emotionCount = data.emotions || {};
    }

    // Update dream sign counts
    analysis.dreamSigns.forEach((sign) => {
      patterns[sign] = (patterns[sign] || 0) + 1;
    });

    // Update theme counts
    analysis.themes.forEach((theme) => {
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });

    // Update emotion counts
    analysis.emotions.forEach((emotion) => {
      emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
    });

    await setDoc(
      patternsDoc,
      {
        dreamSigns: patterns,
        themes: themeCount,
        emotions: emotionCount,
        lastUpdated: new Date().toISOString(),
      },
      {merge: true}
    );
  } catch (error) {
    console.error("Error updating dream patterns:", error);
  }
};

// ✅ Get user dream patterns
export const getUserDreamPatterns = async (userId: string) => {
  try {
    const patternsDoc = await getDoc(
      doc(db, "users", userId, "data", "dreamPatterns")
    );

    if (!patternsDoc.exists()) {
      return {topDreamSigns: [], topThemes: [], topEmotions: []};
    }

    const data = patternsDoc.data();
    const dreamSigns = data.dreamSigns || {};
    const themes = data.themes || {};
    const emotions = data.emotions || {};

    // Convert to sorted arrays
    const topDreamSigns = Object.entries(dreamSigns)
      .map(([sign, count]) => ({sign, count: count as number}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topThemes = Object.entries(themes)
      .map(([theme, count]) => ({theme, count: count as number}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topEmotions = Object.entries(emotions)
      .map(([emotion, count]) => ({emotion, count: count as number}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {topDreamSigns, topThemes, topEmotions};
  } catch (error) {
    console.error("Error getting dream patterns:", error);
    return {topDreamSigns: [], topThemes: [], topEmotions: []};
  }
};

// ✅ Alias for compatibility
export const analyzeDream = analyzeDreamWithAI;
