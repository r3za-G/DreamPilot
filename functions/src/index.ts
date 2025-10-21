import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import OpenAI from "openai";

const openaiKey = defineString("OPENAI_API_KEY");

const openai = new OpenAI({
  apiKey: openaiKey.value(),
});

interface AnalyzeDreamRequest {
  dreamText: string;
  dreamTitle: string;
  isLucid?: boolean;
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

    const {dreamText, dreamTitle, isLucid = false} = request.data;

    if (!dreamText || dreamText.length < 10) {
      throw new HttpsError("invalid-argument", "Dream text too short");
    }

    try {
      // eslint-disable-next-line max-len
      const prompt = `You are an expert lucid dreaming coach. Analyze this dream:

Title: "${dreamTitle}"
Content: "${dreamText}"
Was Lucid: ${isLucid}

Return ONLY valid JSON with this structure (no other text):
{
  "dreamSigns": ["sign1", "sign2"],
  "themes": ["theme1", "theme2"],
  "emotions": ["emotion1", "emotion2"],
  "lucidityPotential": "medium",
  "insights": "2-3 sentences",
  "suggestions": ["tip1", "tip2", "tip3"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            // eslint-disable-next-line max-len
            content: "You are a lucid dreaming expert. Respond ONLY with valid JSON.",
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

      return {
        success: true,
        analysis: analysis,
      };
    } catch (error: any) {
      console.error("OpenAI error:", error);
      throw new HttpsError("internal", "Analysis failed");
    }
  }
);
