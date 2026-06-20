export type LinkSignal = {
  label: string;
  severity: "info" | "warning" | "danger";
};

export type LinkAgentResult = {
  rawInput: string;
  detectedUrl: string;
  normalizedUrl: string | null;
  isValidUrl: boolean;
  signals: LinkSignal[];
};

const URL_PATTERN = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/i;
const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly"
]);

export function inspectPastedLink(input: string): LinkAgentResult {
  const detectedUrl = extractUrl(input);
  const normalizedUrl = normalizeDetectedUrl(detectedUrl);
  const signals: LinkSignal[] = [];

  if (!detectedUrl) {
    return {
      rawInput: input,
      detectedUrl: "",
      normalizedUrl: null,
      isValidUrl: false,
      signals: input.trim()
        ? [{ label: "No URL detected in pasted text", severity: "warning" }]
        : []
    };
  }

  if (detectedUrl !== input.trim()) {
    signals.push({ label: "URL extracted from surrounding text", severity: "info" });
  }

  if (!normalizedUrl) {
    signals.push({ label: "Detected text is not a valid URL", severity: "danger" });
    return {
      rawInput: input,
      detectedUrl,
      normalizedUrl: null,
      isValidUrl: false,
      signals
    };
  }

  const parsed = new URL(normalizedUrl);
  const host = parsed.hostname.toLowerCase();

  if (parsed.protocol !== "https:") {
    signals.push({ label: "URL does not use HTTPS", severity: "warning" });
  }

  if (SHORTENER_HOSTS.has(host)) {
    signals.push({ label: "Known URL shortener detected", severity: "warning" });
  }

  if (parsed.username || parsed.password) {
    signals.push({ label: "URL contains embedded credentials", severity: "danger" });
  }

  if (hasSuspiciousKeyword(normalizedUrl)) {
    signals.push({ label: "Credential or lure keyword detected", severity: "warning" });
  }

  if (looksLikeIpAddress(host)) {
    signals.push({ label: "Hostname is an IP address", severity: "warning" });
  }

  return {
    rawInput: input,
    detectedUrl,
    normalizedUrl,
    isValidUrl: true,
    signals
  };
}

export function extractUrl(input: string) {
  return input.match(URL_PATTERN)?.[0]?.replace(/[),.]+$/, "") ?? "";
}

export function normalizeDetectedUrl(input: string) {
  if (!input.trim()) {
    return null;
  }

  const candidate = input.startsWith("www.") ? `https://${input}` : input;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function hasSuspiciousKeyword(url: string) {
  const lowerUrl = url.toLowerCase();
  return ["login", "verify", "password", "free", "gift", "claim"].some((keyword) =>
    lowerUrl.includes(keyword)
  );
}

function looksLikeIpAddress(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}
