import { inspectPastedLink } from "@/utils/link-agent";
import type { ScanEvidence } from "@/services/types";

type ReputationResult = {
  score: number;
  signals: string[];
  evidence: ScanEvidence[];
};

type SafeBrowsingResponse = {
  matches?: Array<{
    threatType?: string;
    platformType?: string;
    threat?: { url?: string };
  }>;
};

type VirusTotalStats = {
  harmless?: number;
  malicious?: number;
  suspicious?: number;
  timeout?: number;
  undetected?: number;
};

type VirusTotalResponse = {
  data?: {
    attributes?: {
      last_analysis_stats?: VirusTotalStats;
      reputation?: number;
    };
  };
};

export async function checkReputation(url: string): Promise<ReputationResult> {
  const signals: string[] = [];
  const pasteSignals: string[] = [];
  let score = 5;

  const lowerUrl = url.toLowerCase();
  const agentResult = inspectPastedLink(url);

  for (const signal of agentResult.signals) {
    if (signal.severity === "danger") {
      score += 50;
    } else if (signal.severity === "warning") {
      score += 15;
    }

    signals.push(signal.label);
    pasteSignals.push(signal.label);
  }

  if (lowerUrl.includes("login") || lowerUrl.includes("verify")) {
    score += 25;
    signals.push("URL contains a credential-related keyword");
    pasteSignals.push("URL contains a credential-related keyword");
  }

  if (lowerUrl.includes("free") || lowerUrl.includes("gift")) {
    score += 15;
    signals.push("URL contains a lure-style keyword");
    pasteSignals.push("URL contains a lure-style keyword");
  }

  const [safeBrowsingResult, virusTotalResult] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(url)
  ]);

  score += safeBrowsingResult.score + virusTotalResult.score;
  signals.push(...safeBrowsingResult.signals, ...virusTotalResult.signals);

  return {
    score: Math.min(score, 100),
    signals,
    evidence: [
      {
        source: "Paste analysis",
        status: pasteSignals.length > 0 ? "flagged" : "clean",
        summary:
          pasteSignals.length > 0
            ? "The pasted input contains suspicious link patterns."
            : "No suspicious paste-level patterns were found.",
        details: pasteSignals.length > 0 ? pasteSignals : ["No local warning signals"],
        scoreImpact:
          pasteSignals.length > 0
            ? score - safeBrowsingResult.score - virusTotalResult.score
            : 0
      },
      ...safeBrowsingResult.evidence,
      ...virusTotalResult.evidence
    ]
  };
}

async function checkGoogleSafeBrowsing(url: string): Promise<ReputationResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return {
      score: 0,
      signals: ["Google Safe Browsing not configured"],
      evidence: [
        {
          source: "Google Safe Browsing",
          status: "unavailable",
          summary: "Google Safe Browsing is not configured.",
          details: ["Missing GOOGLE_SAFE_BROWSING_API_KEY"],
          scoreImpact: 0
        }
      ]
    };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "isitsafe-demo",
            clientVersion: "0.1.0"
          },
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
        })
      }
    );

    if (!response.ok) {
      return {
        score: 0,
        signals: [`Google Safe Browsing lookup failed: HTTP ${response.status}`],
        evidence: [
          {
            source: "Google Safe Browsing",
            status: "unavailable",
            summary: "Google Safe Browsing lookup failed.",
            details: [`HTTP ${response.status}`],
            scoreImpact: 0
          }
        ]
      };
    }

    const data = (await response.json()) as SafeBrowsingResponse;
    const matches = data.matches ?? [];

    if (matches.length === 0) {
      return {
        score: 0,
        signals: ["Google Safe Browsing found no match"],
        evidence: [
          {
            source: "Google Safe Browsing",
            status: "clean",
            summary: "No Google Safe Browsing threat match.",
            details: ["Checked malware, social engineering, unwanted software, and harmful apps"],
            scoreImpact: 0
          }
        ]
      };
    }

    const threatTypes = matches
      .map((match) => match.threatType)
      .filter(Boolean)
      .join(", ");

    return {
      score: 85,
      signals: [
        `Google Safe Browsing matched this URL${threatTypes ? `: ${threatTypes}` : ""}`
      ],
      evidence: [
        {
          source: "Google Safe Browsing",
          status: "flagged",
          summary: "Google Safe Browsing matched this URL.",
          details: threatTypes ? [threatTypes] : ["Threat match returned"],
          scoreImpact: 85
        }
      ]
    };
  } catch {
    return {
      score: 0,
      signals: ["Google Safe Browsing lookup failed"],
      evidence: [
        {
          source: "Google Safe Browsing",
          status: "unavailable",
          summary: "Google Safe Browsing lookup failed.",
          details: ["Network or provider error"],
          scoreImpact: 0
        }
      ]
    };
  }
}

async function checkVirusTotal(url: string): Promise<ReputationResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return {
      score: 0,
      signals: ["VirusTotal not configured"],
      evidence: [
        {
          source: "VirusTotal",
          status: "unavailable",
          summary: "VirusTotal is not configured.",
          details: ["Missing VIRUSTOTAL_API_KEY"],
          scoreImpact: 0
        }
      ]
    };
  }

  const urlResult = await fetchVirusTotalUrl(url, apiKey);
  if (urlResult) {
    return urlResult;
  }

  return fetchVirusTotalDomain(url, apiKey);
}

async function fetchVirusTotalUrl(
  url: string,
  apiKey: string
): Promise<ReputationResult | null> {
  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${encodeVirusTotalUrlId(url)}`,
      {
        headers: { "x-apikey": apiKey }
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return {
        score: 0,
        signals: [`VirusTotal URL lookup failed: HTTP ${response.status}`],
        evidence: [
          {
            source: "VirusTotal URL",
            status: "unavailable",
            summary: "VirusTotal URL lookup failed.",
            details: [`HTTP ${response.status}`],
            scoreImpact: 0
          }
        ]
      };
    }

    const data = (await response.json()) as VirusTotalResponse;
    return scoreVirusTotalStats(data.data?.attributes?.last_analysis_stats, "URL");
  } catch {
    return {
      score: 0,
      signals: ["VirusTotal URL lookup failed"],
      evidence: [
        {
          source: "VirusTotal URL",
          status: "unavailable",
          summary: "VirusTotal URL lookup failed.",
          details: ["Network or provider error"],
          scoreImpact: 0
        }
      ]
    };
  }
}

async function fetchVirusTotalDomain(
  url: string,
  apiKey: string
): Promise<ReputationResult> {
  try {
    const hostname = new URL(url).hostname;
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${hostname}`,
      {
        headers: { "x-apikey": apiKey }
      }
    );

    if (response.status === 404) {
      return {
        score: 10,
        signals: ["VirusTotal has no domain report"],
        evidence: [
          {
            source: "VirusTotal domain",
            status: "unavailable",
            summary: "VirusTotal has no domain report.",
            details: ["Domain was not found in VirusTotal"],
            scoreImpact: 10
          }
        ]
      };
    }

    if (!response.ok) {
      return {
        score: 0,
        signals: [`VirusTotal domain lookup failed: HTTP ${response.status}`],
        evidence: [
          {
            source: "VirusTotal domain",
            status: "unavailable",
            summary: "VirusTotal domain lookup failed.",
            details: [`HTTP ${response.status}`],
            scoreImpact: 0
          }
        ]
      };
    }

    const data = (await response.json()) as VirusTotalResponse;
    return scoreVirusTotalStats(
      data.data?.attributes?.last_analysis_stats,
      "domain"
    );
  } catch {
    return {
      score: 0,
      signals: ["VirusTotal domain lookup failed"],
      evidence: [
        {
          source: "VirusTotal domain",
          status: "unavailable",
          summary: "VirusTotal domain lookup failed.",
          details: ["Network or provider error"],
          scoreImpact: 0
        }
      ]
    };
  }
}

function scoreVirusTotalStats(
  stats: VirusTotalStats | undefined,
  scope: "URL" | "domain"
): ReputationResult {
  if (!stats) {
    return {
      score: 0,
      signals: [`VirusTotal ${scope} report has no analysis stats`],
      evidence: [
        {
          source: `VirusTotal ${scope}`,
          status: "unavailable",
          summary: `VirusTotal ${scope} report has no analysis stats.`,
          details: ["No engine counts were returned"],
          scoreImpact: 0
        }
      ]
    };
  }

  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;
  const score = Math.min(malicious * 35 + suspicious * 20, 80);

  if (malicious > 0 || suspicious > 0) {
    return {
      score,
      signals: [
        `VirusTotal ${scope} report: ${malicious} malicious, ${suspicious} suspicious`
      ],
      evidence: [
        {
          source: `VirusTotal ${scope}`,
          status: "flagged",
          summary: `VirusTotal ${scope} report contains malicious or suspicious detections.`,
          details: [
            `${malicious} malicious engines`,
            `${suspicious} suspicious engines`
          ],
          scoreImpact: score
        }
      ]
    };
  }

  return {
    score: 0,
    signals: [`VirusTotal ${scope} report found no malicious engines`],
    evidence: [
      {
        source: `VirusTotal ${scope}`,
        status: "clean",
        summary: `VirusTotal ${scope} report found no malicious engines.`,
        details: [
          `${stats.harmless ?? 0} harmless engines`,
          `${stats.undetected ?? 0} undetected engines`
        ],
        scoreImpact: 0
      }
    ]
  };
}

function encodeVirusTotalUrlId(url: string) {
  return Buffer.from(url).toString("base64url").replace(/=+$/, "");
}
