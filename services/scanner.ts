import { randomUUID } from "crypto";
import { explainScan } from "@/services/ai";
import { scanPage } from "@/services/page-scanner";
import { checkReputation } from "@/services/reputation";
import { saveScan } from "@/services/store";
import type { ScanRecord } from "@/services/types";

export async function runScan(url: string): Promise<ScanRecord> {
  const normalizedUrl = normalizeUrl(url);
  const [reputation, snapshot] = await Promise.all([
    checkReputation(normalizedUrl),
    scanPage(normalizedUrl)
  ]);

  const textScore = snapshot.text.toLowerCase().includes("password") ? 20 : 0;
  const score = Math.min(reputation.score + textScore, 100);
  const status = score >= 50 ? "unsafe" : "safe";
  const explanation = await explainScan({
    url: normalizedUrl,
    reputationScore: score,
    signals: reputation.signals,
    snapshot
  });

  return saveScan({
    id: randomUUID(),
    url: normalizedUrl,
    score,
    status,
    screenshot: snapshot.screenshot,
    explanation,
    created_at: new Date().toISOString()
  });
}

function normalizeUrl(url: string) {
  const parsed = new URL(url);
  return parsed.toString();
}
