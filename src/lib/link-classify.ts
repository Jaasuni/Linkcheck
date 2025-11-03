/**
 * Classifies a host as a gateway or vendor asset
 */
export function classifyHost(
  hostname: string,
  href: string
): {
  isGateway: boolean;
  isVendorAsset: boolean;
  flags: string[];
} {
  const lower = hostname.toLowerCase();
  const flags: string[] = [];
  let isGateway = false;
  let isVendorAsset = false;

  // Gateways
  const gateways = [
    "safelinks.protection.outlook.com",
    "mimecast.com",
    "mimecast-offshore.com",
    "urldefense.proofpoint.com",
    "urldefense.com",
  ];

  for (const gw of gateways) {
    if (lower.includes(gw)) {
      isGateway = true;
      break;
    }
  }

  // Vendor assets
  const vendorPatterns = [
    { pattern: "zendesk.com", name: "Zendesk" },
    { pattern: "force.com", name: "Salesforce" },
    { pattern: "salesforce.com", name: "Salesforce" },
    { pattern: "cloudfront.net", name: "CloudFront" },
  ];

  for (const { pattern, name } of vendorPatterns) {
    if (lower.includes(pattern)) {
      // For CloudFront, check if it looks like an image/file
      if (pattern === "cloudfront.net") {
        const fileExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip", ".svg"];
        if (fileExtensions.some((ext) => href.toLowerCase().includes(ext))) {
          isVendorAsset = true;
          flags.push(`${name} asset`);
          break;
        }
      } else {
        isVendorAsset = true;
        flags.push(`${name} asset`);
        break;
      }
    }
  }

  return {
    isGateway,
    isVendorAsset,
    flags,
  };
}



