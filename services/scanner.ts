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

  const textScore = snapshot.text.toLowerCase().includes("password") ? 20 : 0;
  const pageScore = snapshot.captured ? 0 : 60;
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
  const signals = [...reputation.signals, ...pageSignals];
  const score = Math.min(reputation.score + textScore + pageScore, 100);
  const status = score >= 50 ? "unsafe" : "safe";
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
    explanation,
    evidence: [...reputation.evidence, browserEvidence],
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
