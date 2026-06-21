export type LinkSignal = {
  label: string;
  severity: "info" | "warning" | "danger";
};

export type InputKind =
  | "empty"
  | "url"
  | "sms"
  | "email"
  | "social"
  | "qr-text"
  | "mixed-text";

export type LinkAgentResult = {
  rawInput: string;
  detectedUrl: string;
  detectedUrls: string[];
  normalizedUrl: string | null;
  isValidUrl: boolean;
  domain: string | null;
  inputKind: InputKind;
  signals: LinkSignal[];
};

const URL_PATTERN =
  /(?:hxxps?|https?):\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"'`]*)?/gi;
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
const KNOWN_BRANDS = [
  "google",
  "youtube",
  "facebook",
  "instagram",
  "microsoft",
  "apple",
  "paypal",
  "amazon",
  "netflix"
];

export function inspectPastedLink(input: string): LinkAgentResult {
  const inputKind = classifyInput(input);
  const detectedUrls = extractUrls(input);
  const detectedUrl = detectedUrls[0] ?? "";
  const normalizedUrl = normalizeDetectedUrl(detectedUrl);
  const signals: LinkSignal[] = [];

  if (!detectedUrl) {
    return {
      rawInput: input,
      detectedUrl: "",
      detectedUrls: [],
      normalizedUrl: null,
      isValidUrl: false,
      domain: null,
      inputKind,
      signals: input.trim()
        ? [{ label: "No URL detected in pasted text", severity: "warning" }]
        : []
    };
  }

  if (detectedUrl !== restoreDefangedText(input).trim()) {
    signals.push({ label: "URL extracted from surrounding text", severity: "info" });
  }

  if (detectedUrls.length > 1) {
    signals.push({
      label: `${detectedUrls.length} links found; scanning the first valid link`,
      severity: "warning"
    });
  }

  if (inputKind !== "url") {
    signals.push({ label: `${formatInputKind(inputKind)} input recognized`, severity: "info" });
  }

  if (isDefanged(input)) {
    signals.push({ label: "Defanged link restored for scanning", severity: "info" });
  }

  if (!normalizedUrl) {
    signals.push({ label: "Detected text is not a valid URL", severity: "danger" });
    return {
      rawInput: input,
      detectedUrl,
      detectedUrls,
      normalizedUrl: null,
      isValidUrl: false,
      domain: null,
      inputKind,
      signals
    };
  }

  const parsed = new URL(normalizedUrl);
  const host = parsed.hostname.toLowerCase();

  if (parsed.protocol !== "https:") {
    signals.push({ label: "URL does not use HTTPS", severity: "warning" });
  }

  if (detectedUrl === stripProtocol(normalizedUrl)) {
    signals.push({ label: "Protocol added for scanning", severity: "info" });
  }

  if (SHORTENER_HOSTS.has(host)) {
    signals.push({ label: "Known URL shortener detected", severity: "warning" });
  }

  if (looksLikeBrandTypo(host)) {
    signals.push({ label: "Possible typo-squatting domain", severity: "danger" });
  }

  if (hasManySubdomains(host)) {
    signals.push({ label: "Long subdomain chain detected", severity: "warning" });
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
    detectedUrls,
    normalizedUrl,
    isValidUrl: true,
    domain: host,
    inputKind,
    signals
  };
}

export function extractUrl(input: string) {
  return extractUrls(input)[0] ?? "";
}

export function extractUrls(input: string) {
  const restoredInput = restoreDefangedText(input);
  const candidates = restoredInput.match(URL_PATTERN) ?? [];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const cleaned = cleanCandidate(candidate);
    const normalized = normalizeDetectedUrl(cleaned);

    if (normalized && !seen.has(normalized)) {
      urls.push(cleaned);
      seen.add(normalized);
    }
  }

  return urls;
}

export function normalizeDetectedUrl(input: string) {
  if (!input.trim()) {
    return null;
  }

  const cleaned = cleanCandidate(restoreDefangedText(input));
  const candidate = hasProtocol(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(candidate);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (!isLikelyHost(parsed.hostname)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function restoreDefangedText(input: string) {
  return input
    .replace(/\bhxxps:\/\//gi, "https://")
    .replace(/\bhxxp:\/\//gi, "http://")
    .replace(/\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}/gi, ".")
    .replace(/\[\s*\.\s*\]|\(\s*\.\s*\)|\{\s*\.\s*\}/g, ".")
    .replace(/\s+dot\s+/gi, ".");
}

function isDefanged(input: string) {
  return /\bhxxps?:\/\/|\[\s*(?:\.|dot)\s*\]|\(\s*(?:\.|dot)\s*\)|\{\s*(?:\.|dot)\s*\}/i.test(
    input
  );
}

function cleanCandidate(candidate: string) {
  let cleaned = candidate.trim();

  while (/^[([{<"'`]/.test(cleaned)) {
    cleaned = cleaned.slice(1);
  }

  while (/[)\]}>."'`,;:!?]$/.test(cleaned)) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

function classifyInput(input: string): InputKind {
  const trimmed = input.trim();

  if (!trimmed) {
    return "empty";
  }

  const restored = restoreDefangedText(trimmed);
  const normalized = normalizeDetectedUrl(restored);
  const candidate = cleanCandidate(restored);

  if (
    normalized &&
    (stripTrailingSlash(normalized) === stripTrailingSlash(restored) ||
      stripProtocol(stripTrailingSlash(normalized)) === stripTrailingSlash(candidate))
  ) {
    return "url";
  }

  if (/^mailto:|^from:|^to:|^subject:|\n\s*(from|to|subject|date):/i.test(trimmed)) {
    return "email";
  }

  if (/\b(sms|mms|text message)\b/i.test(trimmed) || /^[+\d][\d\s().-]{6,}:/.test(trimmed)) {
    return "sms";
  }

  if (/\b(dm|direct message|instagram|facebook|messenger|whatsapp|telegram|discord|tiktok)\b/i.test(trimmed)) {
    return "social";
  }

  if (/\b(qr|scan code|camera|screenshot)\b/i.test(trimmed)) {
    return "qr-text";
  }

  return "mixed-text";
}

function formatInputKind(kind: InputKind) {
  const labels: Record<InputKind, string> = {
    empty: "Empty",
    url: "Link",
    sms: "SMS",
    email: "Email",
    social: "Social message",
    "qr-text": "QR or screenshot text",
    "mixed-text": "Mixed text"
  };

  return labels[kind];
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function hasProtocol(input: string) {
  return /^https?:\/\//i.test(input);
}

function isLikelyHost(host: string) {
  return (
    looksLikeIpAddress(host) ||
    /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(host)
  );
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

function hasManySubdomains(host: string) {
  return host.split(".").length >= 5;
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//i, "");
}

function looksLikeBrandTypo(host: string) {
  const labels = host.split(".");
  const domain = labels.length >= 2 ? labels[labels.length - 2] : labels[0];

  return KNOWN_BRANDS.some(
    (brand) => domain !== brand && levenshteinDistance(domain, brand) <= 2
  );
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex++) {
    const current = [leftIndex + 1];

    for (let rightIndex = 0; rightIndex < right.length; rightIndex++) {
      const insert = current[rightIndex] + 1;
      const remove = previous[rightIndex + 1] + 1;
      const replace =
        previous[rightIndex] + (left[leftIndex] === right[rightIndex] ? 0 : 1);

      current.push(Math.min(insert, remove, replace));
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}
