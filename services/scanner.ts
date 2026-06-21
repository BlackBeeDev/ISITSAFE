import { explainScan } from "@/services/ai";
import { scanPage } from "@/services/page-scanner";
import { checkReputation } from "@/services/reputation";
import { saveScan } from "@/services/store";
import { encodeScanToken } from "@/services/token";
import type { ScanRecord } from "@/services/types";

export async function runScan(url: string): Promise<ScanRecord> {
  const normalizedUrl = normalizeUrl(url);
  const [reputation, snapshot] = await Promise.all([
    checkReputation(normalizedUrl),
    scanPage(normalizedUrl)
  ]);

  const textScore = snapshot.text.toLowerCase().includes("password") ? 20 : 0;
  // A page we confirmed unreachable (DNS failure, connection refused) is
  // unverified, not "safe" - treat it as a caution-worthy signal rather
  // than defaulting to the clean baseline. A plain timeout is ambiguous
  // (snapshot.reachable === null) and isn't penalized.
  const unreachablePenalty = snapshot.reachable === false ? 35 : 0;
  const score = Math.min(reputation.score + textScore + unreachablePenalty, 100);
  const status = score >= 50 ? "unsafe" : score >= 25 ? "caution" : "safe";
  const explanation = await explainScan({
    url: normalizedUrl,
    domain: reputation.domain,
    reputationScore: score,
    signals: reputation.signals,
    snapshot
  });

  const created_at = new Date().toISOString();
  const id = encodeScanToken({ url: normalizedUrl, score, status, explanation, created_at });

  return saveScan({
    id,
    url: normalizedUrl,
    score,
    status,
    screenshot: snapshot.screenshot,
    explanation,
    created_at
  });
}

function normalizeUrl(url: string) {
  const parsed = new URL(url);
  return parsed.toString();
}
