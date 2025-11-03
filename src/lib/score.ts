/**
 * Scores a link based on various risk flags
 */

interface ScoreFlags {
  ageDays?: number | null;
  tld?: string;
  brandMismatch?: boolean;
  typosquat?: boolean;
}

export interface ScoreResult {
  score: number;
  label: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
}

export function scoreLink(flags: ScoreFlags): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // Young domain check
  if (flags.ageDays !== undefined && flags.ageDays !== null) {
    if (flags.ageDays < 30) {
      score += 30;
      reasons.push(`Domain registered only ${flags.ageDays} days ago`);
    } else if (flags.ageDays < 90) {
      score += 15;
      reasons.push(`Domain is relatively new (${flags.ageDays} days old)`);
    }
  }

  // Risky TLD check
  const riskyTlds = [".xyz", ".top", ".click", ".monster", ".club", ".work", ".info"];
  if (flags.tld) {
    const tldLower = flags.tld.toLowerCase();
    if (riskyTlds.some((risky) => tldLower === risky)) {
      score += 10;
      reasons.push(`Uses risky top-level domain (${flags.tld})`);
    }
  }

  // Typosquatting / homoglyph
  if (flags.typosquat) {
    score += 15;
    reasons.push("Potential typosquatting or homoglyph attack");
  }

  // Brand mismatch
  if (flags.brandMismatch) {
    score += 10;
    reasons.push("Domain does not match expected brand");
  }

  // Determine label
  let label: "HIGH" | "MEDIUM" | "LOW";
  if (score >= 70) {
    label = "HIGH";
  } else if (score >= 40) {
    label = "MEDIUM";
  } else {
    label = "LOW";
  }

  // If no issues found, add a positive reason
  if (reasons.length === 0) {
    reasons.push("No significant risk factors detected");
  }

  return {
    score,
    label,
    reasons,
  };
}



