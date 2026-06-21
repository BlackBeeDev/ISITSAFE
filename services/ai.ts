import OpenAI from "openai";
import type { PageSnapshot } from "@/services/types";

type ExplanationInput = {
  url: string;
  domain: string;
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
            domain: input.domain,
            score: input.reputationScore,
            signals: input.signals,
            reachable: input.snapshot.reachable,
            navigationError: input.snapshot.navigationError,
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
  const unreachable = input.snapshot.reachable === false;

  if (input.reputationScore >= 50) {
    const reason = unreachable
      ? "it could not be reached and combined with other signals looks suspicious"
      : "it has suspicious signals";
    return `Unsafe. ${input.domain} - ${reason} and should be avoided until verified.`;
  }

  if (input.reputationScore >= 25) {
    const reason = unreachable
      ? "the page could not be reached (broken link, typo, or the site may be down) - this is unverified, not confirmed safe"
      : `${input.signals.join(", ")}`;
    return `Caution. ${input.domain}: ${reason}.`;
  }

  return `Safe. No obvious suspicious signals were found for ${input.domain} in the basic MVP scan.`;
}
