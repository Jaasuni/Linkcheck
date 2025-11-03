import { NextRequest, NextResponse } from "next/server";
import { parse } from "tldts";
import { unwrapGateway } from "@/lib/unwrap";
import { classifyHost } from "@/lib/link-classify";
import { getDomainAgeDays } from "@/lib/domain-age";
import { detectBrands, isBrandAllowedDomain } from "@/lib/brand-match";
import { scoreLink } from "@/lib/score";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, context } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Unwrap gateway URLs
    const unwrapped = unwrapGateway(url);

    // Classify the host
    const classification = classifyHost(
      new URL(unwrapped.display).hostname,
      unwrapped.display
    );

    // Get domain age
    let ageDays: number | null = null;
    try {
      ageDays = await getDomainAgeDays(unwrapped.baseDomain);
    } catch (error) {
      // Continue without age data if RDAP fails
      console.error("RDAP lookup failed:", error);
    }

    // Check for brand mismatch
    const USE_BRAND_MISMATCH = (process.env.USE_BRAND_MISMATCH ?? "true") !== "false";
    let brandMismatch = false;
    
    if (USE_BRAND_MISMATCH && context) {
      const detectedBrands = detectBrands(context);
      for (const brand of detectedBrands) {
        if (!isBrandAllowedDomain(brand, unwrapped.baseDomain)) {
          brandMismatch = true;
          break;
        }
      }
    }

    // Extract TLD
    const domainInfo = parse(unwrapped.baseDomain);
    const tld = domainInfo.publicSuffix ? `.${domainInfo.publicSuffix}` : undefined;

    // Score the link
    const scoreResult = scoreLink({
      ageDays,
      tld,
      brandMismatch,
      typosquat: false, // Could implement homoglyph detection later
    });

    // Build response
    const response = {
      label: scoreResult.label,
      score: scoreResult.score,
      target: {
        original: unwrapped.original,
        display: unwrapped.display,
        baseDomain: unwrapped.baseDomain,
        via: unwrapped.via,
      },
      reasons: scoreResult.reasons,
      meta: {
        ageDays,
        isGateway: classification.isGateway,
        isVendorAsset: classification.isVendorAsset,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



