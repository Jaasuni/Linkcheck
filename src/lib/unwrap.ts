import { parse } from "tldts";

/**
 * Unwraps gateway URLs (SafeLinks, Mimecast, Proofpoint)
 * Returns the final target and path taken
 */
export function unwrapGateway(url: string): {
  original: string;
  display: string;
  baseDomain: string;
  via: string[];
} {
  const via: string[] = [];
  let current = url;
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  while (iterations < maxIterations) {
    iterations++;
    const parsed = new URL(current);
    const hostname = parsed.hostname.toLowerCase();

    // Microsoft SafeLinks
    if (hostname.includes("safelinks.protection.outlook.com")) {
      via.push("SafeLinks");
      const urlParam = parsed.searchParams.get("url");
      if (urlParam) {
        current = decodeURIComponent(urlParam);
        continue;
      }
    }

    // Mimecast
    if (hostname.includes("mimecast.com") || hostname.includes("mimecast-offshore.com")) {
      via.push("Mimecast");
      const urlParam = parsed.searchParams.get("url");
      if (urlParam) {
        current = decodeURIComponent(urlParam);
        continue;
      }
    }

    // Proofpoint (urldefense)
    if (hostname.includes("urldefense.proofpoint.com") || hostname.includes("urldefense.com")) {
      via.push("Proofpoint");
      const uParam = parsed.searchParams.get("u");
      if (uParam) {
        // Basic Proofpoint decoding (v1/v2)
        try {
          let decoded = uParam.replace(/-/g, "%").replace(/_/g, "/");
          decoded = decodeURIComponent(decoded);
          current = decoded;
          continue;
        } catch {
          // If decoding fails, break
        }
      }
    }

    // No more unwrapping possible
    break;
  }

  // Parse final URL
  const finalParsed = new URL(current);
  const domain = parse(finalParsed.hostname);
  const baseDomain = domain.domain || finalParsed.hostname;

  return {
    original: url,
    display: current,
    baseDomain,
    via,
  };
}



