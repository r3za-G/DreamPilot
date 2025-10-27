import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();

const openaiKey = defineString("OPENAI_API_KEY");

const openai = new OpenAI({
  apiKey: openaiKey.value(),
});

interface AnalyzeDreamRequest {
  dreamText: string;
  dreamTitle: string;
  isLucid?: boolean;
  isPremium?: boolean;
}

interface AnalyzeDreamResponse {
  success: boolean;
  analysis: {
    dreamSigns: string[];
    themes: string[];
    emotions: string[];
    lucidityPotential: "low" | "medium" | "high";
    insights: string;
    suggestions: string[];
    analyzedAt: string;
  };
}

export const analyzeDream = onCall<AnalyzeDreamRequest>(
  async (request): Promise<AnalyzeDreamResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    // eslint-disable-next-line max-len
    const {dreamText, dreamTitle, isLucid = false, isPremium = false} = request.data;
    const userId = request.auth.uid;

    // eslint-disable-next-line max-len
    console.log(`🔍 Analysis request - user: ${userId}, isPremium: ${isPremium}`);

    if (!dreamText || dreamText.trim().length < 10) {
      throw new HttpsError(
        "invalid-argument",
        "Dream content must be at least 10 characters"
      );
    }

    const title = dreamTitle?.trim() || "Untitled Dream";

    // Rate limiting for non-premium users
    if (!isPremium) {
      const userRef = admin.firestore().collection("users").doc(userId);

      try {
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (!userData) {
          throw new HttpsError("not-found", "User not found");
        }

        const now = Date.now();
        const lastReset = userData.aiAnalysisResetDate || 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        let analysisCount = userData.aiAnalysisCount || 0;

        // Reset counter if 24 hours passed
        if (now - lastReset > dayInMs) {
          analysisCount = 0;
          await userRef.update({
            aiAnalysisCount: 0,
            aiAnalysisResetDate: now,
          });
        }

        const DAILY_LIMIT = 5;

        // eslint-disable-next-line max-len
        console.log(`📊 Rate limit: ${analysisCount}/${DAILY_LIMIT} analyses used today`);

        if (analysisCount >= DAILY_LIMIT) {
          console.log(`⛔ RATE LIMIT EXCEEDED for user ${userId}`);
          throw new HttpsError(
            "resource-exhausted",
            // eslint-disable-next-line max-len
            `Daily analysis limit reached (${DAILY_LIMIT}/day). Upgrade to Premium for unlimited insights!`
          );
        }

        // Increment counter BEFORE analysis
        await userRef.update({
          aiAnalysisCount: admin.firestore.FieldValue.increment(1),
        });
        // eslint-disable-next-line max-len
        console.log(`✅ Counter incremented to ${analysisCount + 1}/${DAILY_LIMIT}`);
      } catch (error: any) {
        if (error.code === "resource-exhausted") {
          throw error;
        }
        console.error("❌ Rate limit check error:", error);
        throw new HttpsError("internal", "Rate limit check failed");
      }
    } else {
      console.log("✅ Premium user - unlimited analyses");
    }

    // Call OpenAI
    try {
      // ✅ FIXED: No hardcoded "medium" - let AI decide
      // eslint-disable-next-line max-len
      const prompt = `You are an expert lucid dreaming coach. Analyze this dream and assess its lucidity potential.

Title: "${title}"
Content: "${dreamText}"
Was Lucid: ${isLucid}

Based on the dream content, 
determine if it has low, medium, or high potential for lucid dreaming based on:
- Presence of dream signs (unusual events, impossible scenarios)
- Level of self-awareness or questioning reality
- Recurring themes that could trigger lucidity

Return ONLY valid JSON with this structure (no other text):
{
  "dreamSigns": ["specific unusual elements from the dream"],
  "themes": ["main themes present"],
  "emotions": ["emotions experienced"],
  "lucidityPotential": "low OR medium OR high",
  "insights": "2-3 sentences explaining 
  the dream's meaning and lucidity potential",
  "suggestions": ["3 specific tips to increase lucidity in similar dreams"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            // eslint-disable-next-line max-len
            content: "You are a lucid dreaming expert. Analyze dreams and respond ONLY with valid JSON. Set lucidityPotential to 'low', 'medium', or 'high' based on the dream content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content || "{}";
      const analysis = JSON.parse(responseText);
      analysis.analyzedAt = new Date().toISOString();

      console.log(`✅ Analysis completed for user ${userId}`);

      return {
        success: true,
        analysis: analysis,
      };
    } catch (error: any) {
      console.error("❌ OpenAI error:", error);

      // Rollback counter on failure
      if (!isPremium) {
        try {
          await admin.firestore()
            .collection("users")
            .doc(userId)
            .update({
              aiAnalysisCount: admin.firestore.FieldValue.increment(-1),
            });
          console.log("↩️ Counter rolled back due to analysis failure");
        } catch (rollbackError) {
          console.error("Failed to rollback counter:", rollbackError);
        }
      }
      throw new HttpsError("internal", "Analysis failed");
    }
  }
);
