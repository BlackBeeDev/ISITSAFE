type ReputationResult = {
  score: number;
  signals: string[];
  domain: string;
};

const EXTERNAL_API_TIMEOUT_MS = 6000;

async function checkSafeBrowsing(url: string): Promise<{ score: number; signals: string[] }> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return { score: 0, signals: [] };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "isitsafe", clientVersion: "0.1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
          }
        }),
        signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS)
      }
    );

    if (!res.ok) return { score: 0, signals: [] };

    const body = (await res.json()) as { matches?: Array<{ threatType: string }> };
    if (!body.matches || body.matches.length === 0) return { score: 0, signals: [] };

    const threats = [...new Set(body.matches.map((m) => m.threatType))];
    return {
      score: 60,
      signals: threats.map((t) => `Google Safe Browsing flagged this URL: ${t}`)
    };
  } catch (error) {
    console.error("Safe Browsing lookup failed", error);
    return { score: 0, signals: [] };
  }
}

async function checkVirusTotal(domain: string): Promise<{ score: number; signals: string[] }> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { score: 0, signals: [] };

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`, {
      headers: { "x-apikey": apiKey },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS)
    });

    if (!res.ok) return { score: 0, signals: [] };

    const body = (await res.json()) as {
      data?: { attributes?: { last_analysis_stats?: { malicious?: number; suspicious?: number } } };
    };
    const stats = body.data?.attributes?.last_analysis_stats;
    const malicious = stats?.malicious ?? 0;
    const suspicious = stats?.suspicious ?? 0;

    if (malicious === 0 && suspicious === 0) return { score: 0, signals: [] };

    return {
      score: Math.min(malicious * 15 + suspicious * 5, 70),
      signals: [
        `VirusTotal: ${malicious} engine(s) flagged this domain as malicious, ${suspicious} as suspicious`
      ]
    };
  } catch (error) {
    console.error("VirusTotal lookup failed", error);
    return { score: 0, signals: [] };
  }
}

export function extractDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export async function checkReputation(url: string): Promise<ReputationResult> {
  const domain = extractDomain(url);
  const signals: string[] = [];
  let score = 5;

  const [safeBrowsing, virusTotal] = await Promise.all([
    checkSafeBrowsing(url),
    checkVirusTotal(domain)
  ]);

  score += safeBrowsing.score + virusTotal.score;
  signals.push(...safeBrowsing.signals, ...virusTotal.signals);

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
    signals,
    domain
  };
}
