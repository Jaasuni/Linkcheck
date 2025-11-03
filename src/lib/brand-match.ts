/**
 * Brand detection and domain validation
 */

interface BrandConfig {
  name: string;
  keywords: string[];
  allowedDomains: string[];
}

const brands: BrandConfig[] = [
  {
    name: "Microsoft",
    keywords: ["microsoft", "office", "outlook", "teams", "azure", "windows"],
    allowedDomains: [
      "microsoft.com",
      "office.com",
      "live.com",
      "microsoftonline.com",
      "office365.com",
      "outlook.com",
      "sharepoint.com",
    ],
  },
  {
    name: "Google",
    keywords: ["google", "gmail", "drive", "docs", "meet"],
    allowedDomains: [
      "google.com",
      "gmail.com",
      "youtube.com",
      "gstatic.com",
      "googleapis.com",
      "googleusercontent.com",
    ],
  },
  {
    name: "Amazon",
    keywords: ["amazon", "aws", "prime"],
    allowedDomains: ["amazon.com", "aws.amazon.com", "amazonaws.com", "awsstatic.com"],
  },
];

export function detectBrands(text: string): string[] {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  for (const brand of brands) {
    for (const keyword of brand.keywords) {
      if (lowerText.includes(keyword)) {
        if (!detected.includes(brand.name)) {
          detected.push(brand.name);
        }
        break;
      }
    }
  }

  return detected;
}

export function isBrandAllowedDomain(brand: string, baseDomain: string): boolean {
  const brandConfig = brands.find((b) => b.name === brand);
  if (!brandConfig) return true; // Unknown brand, no validation

  const lower = baseDomain.toLowerCase();
  return brandConfig.allowedDomains.some((allowed) => {
    return lower === allowed || lower.endsWith(`.${allowed}`);
  });
}



