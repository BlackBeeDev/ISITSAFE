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
  // false when the browser successfully launched but couldn't reach the
  // target (DNS failure, connection refused, timeout) - a real signal about
  // the URL. null means our own scanning infra failed (e.g. browser didn't
  // launch), which says nothing about the target and shouldn't be penalized.
  reachable: boolean | null;
  navigationError: string | null;
};
