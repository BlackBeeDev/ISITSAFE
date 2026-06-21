import { getScanResult } from "@/services/results";

export type ReportAuthority = {
  id: string;
  name: string;
  description: string;
};

export type LinkReport = {
  id: string;
  scanId: string;
  url: string;
  authorityIds: string[];
  createdAt: string;
};

export const REPORT_AUTHORITIES: ReportAuthority[] = [
  {
    id: "google-safe-browsing",
    name: "Google Safe Browsing",
    description: "Flag phishing, malware, and deceptive pages for browser protection."
  },
  {
    id: "ftc",
    name: "FTC Fraud Report",
    description: "Escalate consumer scam and impersonation links."
  },
  {
    id: "internal-security",
    name: "Internal Security Queue",
    description: "Send the link to the review team configured for this demo."
  }
];

const globalReports = globalThis as typeof globalThis & {
  isItSafeReports?: LinkReport[];
};

const reports = globalReports.isItSafeReports ?? [];
globalReports.isItSafeReports = reports;

export async function createLinkReport(scanId: string, authorityIds: string[]) {
  const scan = await getScanResult(scanId);

  if (!scan) {
    throw new Error("Scan result not found");
  }

  if (scan.status !== "unsafe" && scan.score < 50) {
    throw new Error("Only unsafe or high-risk links can be reported");
  }

  const validAuthorityIds = REPORT_AUTHORITIES.map((authority) => authority.id);
  const selectedAuthorityIds = authorityIds.filter((id) =>
    validAuthorityIds.includes(id)
  );

  if (selectedAuthorityIds.length === 0) {
    throw new Error("Select at least one authority");
  }

  const report: LinkReport = {
    id: crypto.randomUUID(),
    scanId,
    url: scan.url,
    authorityIds: selectedAuthorityIds,
    createdAt: new Date().toISOString()
  };

  reports.push(report);
  console.info("Demo report queued", report);

  return report;
}
