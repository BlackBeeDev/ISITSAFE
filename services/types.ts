export type ScanStatus = "safe" | "unsafe";

export type ScanRecord = {
  id: string;
  url: string;
  score: number;
  status: ScanStatus;
  screenshot: string | null;
  explanation: string;
  created_at: string;
};

export type ScanRequest = {
  url: string;
};

export type ScanStartResponse = {
  id: string;
};

export type ScanErrorResponse = {
  error: string;
};

export type ScanResultResponse = ScanRecord;

export type PageSnapshot = {
  screenshot: string | null;
  text: string;
};
