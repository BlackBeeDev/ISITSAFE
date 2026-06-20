import OpenAI from "openai";
import type { PageSnapshot } from "@/services/types";

type ExplanationInput = {
  url: string;
  reputationScore: number;
  signals: string[];
  snapshot: PageSnapshot;
};

export async function explainScan(input: ExplanationInput) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackExplanation(input);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You explain URL safety scan results in one concise sentence for a consumer."
        },
        {
          role: "user",
          content: JSON.stringify({
            url: input.url,
            score: input.reputationScore,
            signals: input.signals,
            text: input.snapshot.text.slice(0, 3000)
          })
        }
      ]
    });

    return (
      response.choices[0]?.message.content?.trim() ?? fallbackExplanation(input)
    );
  } catch (error) {
    console.error("OpenAI explanation failed", error);
    return fallbackExplanation(input);
  }
}

function fallbackExplanation(input: ExplanationInput) {
  if (input.reputationScore >= 50) {
    return "Unsafe. This URL has suspicious signals and should be avoided until verified.";
  }

  if (input.signals.length > 0) {
    return `Safe with caution. ${input.signals.join(", ")}.`;
  }

  return "Safe. No obvious suspicious signals were found in the basic MVP scan.";
}
