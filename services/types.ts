export type ScanStatus = "safe" | "caution" | "unsafe";

export type ScanRecord = {
  id: string;
  url: string;
  score: number;
  status: ScanStatus;
  screenshot: string | null;
  explanation: string;
  created_at: string;
};

export type PageSnapshot = {
  screenshot: string | null;
  text: string;
};
