export type ScanStatus = "safe" | "unsafe";

export type EvidenceStatus = "clean" | "flagged" | "unavailable";

export type ScanEvidence = {
  source: string;
  status: EvidenceStatus;
  summary: string;
  details: string[];
  scoreImpact: number;
};

export type ScanRecord = {
  id: string;
  url: string;
  score: number;
  status: ScanStatus;
  screenshot: string | null;
  explanation: string;
  evidence: ScanEvidence[];
  created_at: string;
};

export type PageSnapshot = {
  screenshot: string | null;
  text: string;
  captured: boolean;
  error: string | null;
};
