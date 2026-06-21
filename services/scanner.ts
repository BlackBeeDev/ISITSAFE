import { randomUUID } from "crypto";
import { explainScan } from "@/services/ai";
import { scanPage } from "@/services/page-scanner";
import { checkReputation } from "@/services/reputation";
import { saveScan } from "@/services/store";
import type { ScanEvidence, ScanRecord } from "@/services/types";
import { inspectPastedLink } from "@/utils/link-agent";

export async function runScan(url: string): Promise<ScanRecord> {
  const normalizedUrl = normalizeUrl(url);
  const [reputation, snapshot] = await Promise.all([
    checkReputation(normalizedUrl),
    scanPage(normalizedUrl)
  ]);

  const pageTextRisk = scorePageText(snapshot.text);
  const pageScore = snapshot.captured ? 0 : scorePageFailure(snapshot.error);
  const pageSignals = snapshot.error
    ? [`Browser scanner: ${snapshot.error}`]
    : [];
  const browserEvidence: ScanEvidence = {
    source: "Page scanner",
    status: snapshot.captured ? "clean" : "unavailable",
    summary: snapshot.captured
      ? "The page opened in the isolated browser and a screenshot was captured."
      : "The isolated browser could not open the page.",
    details: snapshot.error
      ? [snapshot.error]
      : [
          snapshot.text
            ? `Extracted ${snapshot.text.length} characters of page text`
            : "No visible page text extracted"
        ],
    scoreImpact: pageScore
  };
  const score = Math.min(reputation.score + pageTextRisk.score + pageScore, 100);
  const signals = [
    ...reputation.signals,
    ...pageTextRisk.signals,
    ...pageSignals
  ];
  const status = shouldMarkUnsafe(score, signals, snapshot.captured) ? "unsafe" : "safe";
  const explanation = await explainScan({
    url: normalizedUrl,
    reputationScore: score,
    signals,
    snapshot
  });

  return saveScan({
    id: randomUUID(),
    url: normalizedUrl,
    score,
    status,
    screenshot: snapshot.screenshot,
    video: snapshot.video,
    explanation,
    evidence: [
      ...reputation.evidence,
      ...(pageTextRisk.signals.length > 0
        ? [
            {
              source: "Page text analysis",
              status: "flagged" as const,
              summary: "The visible page text contains phishing-style prompts.",
              details: pageTextRisk.signals,
              scoreImpact: pageTextRisk.score
            }
          ]
        : []),
      browserEvidence
    ],
    created_at: new Date().toISOString()
  });
}

function normalizeUrl(url: string) {
  const result = inspectPastedLink(url);

  if (!result.normalizedUrl) {
    throw new Error("No valid URL detected");
  }

  return result.normalizedUrl;
}

function scorePageText(text: string) {
  const lowerText = text.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  if (/\b(password|passcode|security code|verification code|otp|pin)\b/.test(lowerText)) {
    score += 12;
    signals.push("Page asks for sensitive account information");
  }

  if (/\b(verify your account|account locked|account suspended|unusual activity|unauthorized charge)\b/.test(lowerText)) {
    score += 18;
    signals.push("Page uses account-warning language");
  }

  if (/\b(urgent|immediately|final notice|expires today|act now)\b/.test(lowerText)) {
    score += 10;
    signals.push("Page uses urgency language");
  }

  if (/\b(bank|paypal|microsoft|apple|amazon|netflix)\b/.test(lowerText) && signals.length >= 2) {
    score += 12;
    signals.push("Page appears to imitate a trusted service");
  }

  return {
    score: Math.min(score, 45),
    signals
  };
}

function scorePageFailure(error: string | null) {
  if (!error) {
    return 10;
  }

  if (/HTTP\s+(401|403|404|405|429)/i.test(error)) {
    return 5;
  }

  if (/HTTP\s+5\d\d/i.test(error)) {
    return 10;
  }

  return 15;
}

function shouldMarkUnsafe(score: number, signals: string[], captured: boolean) {
  const combinedSignals = signals.join(" ").toLowerCase();
  const threatIntelFlag = signals.some((signal) => {
    const normalizedSignal = signal.toLowerCase();

    return (
      normalizedSignal.includes("safe browsing matched") ||
      /virustotal .* report: [1-9]\d* malicious/.test(normalizedSignal) ||
      /virustotal .* report: \d+ malicious, [1-9]\d* suspicious/.test(normalizedSignal)
    );
  });
  const highConfidenceLocal =
    combinedSignals.includes("typo-squatting") ||
    combinedSignals.includes("embedded credentials") ||
    combinedSignals.includes("imitate a trusted service");

  if (threatIntelFlag) {
    return true;
  }

  if (score >= 65) {
    return true;
  }

  return captured && score >= 50 && highConfidenceLocal;
}
