type ReputationResult = {
  score: number;
  signals: string[];
};

export async function checkReputation(url: string): Promise<ReputationResult> {
  const signals: string[] = [];
  let score = 5;

  if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
    signals.push("Google Safe Browsing hook configured");
  }

  if (process.env.VIRUSTOTAL_API_KEY) {
    signals.push("VirusTotal hook configured");
  }

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("login") || lowerUrl.includes("verify")) {
    score += 25;
    signals.push("URL contains a credential-related keyword");
  }

  if (lowerUrl.includes("free") || lowerUrl.includes("gift")) {
    score += 15;
    signals.push("URL contains a lure-style keyword");
  }

  return {
    score: Math.min(score, 100),
    signals
  };
}
