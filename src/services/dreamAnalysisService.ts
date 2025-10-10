import { openai, OPENAI_CONFIG } from '../config/openai';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export type DreamAnalysis = {
  dreamSigns: string[];
  themes: string[];
  emotions: string[];
  lucidityPotential: 'low' | 'medium' | 'high';
  insights: string;
  suggestions: string[];
  analyzedAt: string;
};

export const analyzeDream = async (
  dreamTitle: string,
  dreamContent: string,
  isLucid: boolean
): Promise<DreamAnalysis | null> => {
  try {
    const prompt = `You are an expert lucid dreaming coach analyzing a dream journal entry. 

Dream Title: "${dreamTitle}"
Dream Content: "${dreamContent}"
Was Lucid: ${isLucid ? 'Yes' : 'No'}

Analyze this dream and provide:
1. Dream Signs: Identify 2-4 specific unusual elements or patterns that could serve as reality check triggers (e.g., "flying", "deceased relative", "impossible physics", "changing locations")
2. Themes: 2-3 main themes (e.g., "adventure", "anxiety", "exploration", "transformation")
3. Emotions: 2-3 emotions experienced (e.g., "fear", "joy", "confusion", "excitement")
4. Lucidity Potential: Rate as "low", "medium", or "high" based on how many dream signs and unusual elements were present
5. Insights: One paragraph of insight about what this dream might mean and how it relates to lucid dreaming practice
6. Suggestions: 2-3 specific, actionable suggestions for achieving lucidity based on this dream's patterns

Format your response as valid JSON with this exact structure:
{
  "dreamSigns": ["sign1", "sign2", "sign3"],
  "themes": ["theme1", "theme2"],
  "emotions": ["emotion1", "emotion2"],
  "lucidityPotential": "medium",
  "insights": "Your insight paragraph here",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert lucid dreaming coach and dream analyst. Provide insightful, practical analysis that helps users achieve lucid dreams. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.max_tokens,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const analysis = JSON.parse(response) as DreamAnalysis;
    analysis.analyzedAt = new Date().toISOString();

    return analysis;
  } catch (error) {
    console.error('Error analyzing dream with OpenAI:', error);
    return null;
  }
};

export const saveDreamAnalysis = async (
  userId: string,
  dreamId: string,
  analysis: DreamAnalysis
): Promise<void> => {
  try {
    await setDoc(
      doc(db, 'dreams', dreamId),
      {
        analysis,
        analyzed: true,
      },
      { merge: true }
    );

    // Also update user's dream sign patterns
    await updateUserDreamPatterns(userId, analysis);
  } catch (error) {
    console.error('Error saving dream analysis:', error);
    throw error;
  }
};

const updateUserDreamPatterns = async (
  userId: string,
  analysis: DreamAnalysis
): Promise<void> => {
  try {
    const patternsDoc = doc(db, 'users', userId, 'data', 'dreamPatterns');
    const existingPatterns = await getDoc(patternsDoc);

    let patterns: { [key: string]: number } = {};
    let themeCount: { [key: string]: number } = {};
    let emotionCount: { [key: string]: number } = {};

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
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating dream patterns:', error);
  }
};

export const getUserDreamPatterns = async (userId: string): Promise<{
  topDreamSigns: Array<{ sign: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
  topEmotions: Array<{ emotion: string; count: number }>;
}> => {
  try {
    const patternsDoc = await getDoc(doc(db, 'users', userId, 'data', 'dreamPatterns'));

    if (!patternsDoc.exists()) {
      return { topDreamSigns: [], topThemes: [], topEmotions: [] };
    }

    const data = patternsDoc.data();
    const dreamSigns = data.dreamSigns || {};
    const themes = data.themes || {};
    const emotions = data.emotions || {};

    // Convert to sorted arrays
    const topDreamSigns = Object.entries(dreamSigns)
      .map(([sign, count]) => ({ sign, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topThemes = Object.entries(themes)
      .map(([theme, count]) => ({ theme, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topEmotions = Object.entries(emotions)
      .map(([emotion, count]) => ({ emotion, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { topDreamSigns, topThemes, topEmotions };
  } catch (error) {
    console.error('Error getting dream patterns:', error);
    return { topDreamSigns: [], topThemes: [], topEmotions: [] };
  }
};
