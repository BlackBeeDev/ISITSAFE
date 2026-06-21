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
  video: string | null;
  explanation: string;
  evidence: ScanEvidence[];
  created_at: string;
};

export type ForwardedEmailStatus = "queued" | "scanned" | "no_link" | "failed";

export type ForwardedEmailRecord = {
  id: string;
  provider: string;
  message_id: string | null;
  from_email: string | null;
  to_email: string | null;
  subject: string | null;
  body_preview: string;
  detected_urls: string[];
  scan_ids: string[];
  status: ForwardedEmailStatus;
  error: string | null;
  created_at: string;
};

export type PageSnapshot = {
  screenshot: string | null;
  video: string | null;
  text: string;
  captured: boolean;
  error: string | null;
};
