import dns from "node:dns/promises";
import net from "node:net";

// Blocks the headless browser from being used as an SSRF proxy: refuses
// non-http(s) schemes, and refuses hostnames that resolve to private,
// loopback, link-local, or other non-public IP ranges (including cloud
// metadata endpoints like 169.254.169.254).
export async function assertSafeToFetch(url: string) {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = parsed.hostname;
  const addresses =
    net.isIP(hostname) ? [hostname] : (await dns.lookup(hostname, { all: true })).map((a) => a.address);

  if (addresses.length === 0) {
    throw new Error("Could not resolve host");
  }

  for (const address of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new Error("Refusing to fetch a private or reserved address");
    }
  }
}

function isPrivateOrReservedIp(address: string): boolean {
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fe80:") || // link-local
      normalized.startsWith("fc") || // unique local
      normalized.startsWith("fd") || // unique local
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:169.254.")
    );
  }

  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) {
    return true; // can't parse it, don't trust it
  }
  const [a, b] = octets;

  return (
    a === 127 || // loopback
    a === 10 || // private
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 169 && b === 254) || // link-local / cloud metadata
    a === 0 || // "this network"
    a >= 224 // multicast/reserved
  );
}
