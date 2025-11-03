"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { copyReport } from "@/lib/copy-report";

interface AnalysisResult {
  label: "HIGH" | "MEDIUM" | "LOW";
  score: number;
  target: {
    original: string;
    display: string;
    baseDomain: string;
    via: string[];
  };
  reasons: string[];
  meta: {
    ageDays: number | null;
    isGateway: boolean;
    isVendorAsset: boolean;
  };
}

export default function CheckPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle deep linking
  useEffect(() => {
    const linkParam = searchParams.get("link");
    if (linkParam) {
      setUrl(decodeURIComponent(linkParam));
      // Auto-analyze on mount
      setTimeout(() => {
        handleAnalyze(decodeURIComponent(linkParam), "");
      }, 100);
    }
  }, [searchParams]);

  const handleAnalyze = async (urlToCheck?: string, contextToUse?: string) => {
    const targetUrl = urlToCheck ?? url;
    const targetContext = contextToUse ?? context;

    if (!targetUrl.trim()) {
      setError("Please enter a URL to check");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCopySuccess(false);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: targetUrl,
          context: targetContext || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze link");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      setError("Failed to read from clipboard. Please paste manually.");
    }
  };

  const handleCopyReport = async () => {
    if (!result) return;
    
    try {
      await copyReport(result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError("Failed to copy report to clipboard");
    }
  };

  const handleOpenSite = () => {
    if (result && result.label !== "HIGH") {
      window.open(result.target.display, "_blank", "noopener,noreferrer");
    }
  };

  const getRiskColor = (label: string) => {
    switch (label) {
      case "HIGH":
        return "text-red-600 dark:text-red-400";
      case "MEDIUM":
        return "text-yellow-600 dark:text-yellow-400";
      case "LOW":
        return "text-green-600 dark:text-green-400";
      default:
        return "";
    }
  };

  const getRiskBg = (label: string) => {
    switch (label) {
      case "HIGH":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      case "MEDIUM":
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
      case "LOW":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <header className="mb-8">
        <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
          LinkCheck
        </Link>
      </header>

      <main className="max-w-4xl w-full mx-auto space-y-6 flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="text-sm font-medium">
              URL to check
            </label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/suspicious-link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleAnalyze();
                }
              }}
              disabled={loading}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="text-sm font-medium hover:underline focus:underline text-muted-foreground"
            >
              {showContext ? "▼" : "▶"} Add context (optional)
            </button>
            
            {showContext && (
              <Textarea
                placeholder="e.g., Email from Microsoft support about account verification"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={loading}
                className="text-base"
                rows={3}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleAnalyze()}
              disabled={loading}
              size="lg"
            >
              {loading ? "Checking..." : "Check Link"}
            </Button>
            
            <Button
              onClick={handlePasteFromClipboard}
              disabled={loading}
              variant="outline"
              size="lg"
            >
              Paste from Clipboard
            </Button>

            {result && (
              <Button
                onClick={handleCopyReport}
                disabled={loading}
                variant="secondary"
                size="lg"
              >
                {copySuccess ? "Copied!" : "Copy Report"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div aria-live="polite" className="space-y-4">
            <Card className={getRiskBg(result.label)}>
              <CardHeader>
                <CardTitle className={`text-3xl ${getRiskColor(result.label)}`}>
                  {result.label} {result.score}/100
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Target URL
                  </h3>
                  <div className="space-y-2">
                    <p className="font-mono text-sm break-all bg-background/50 p-3 rounded border">
                      {result.target.display}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {result.target.baseDomain}
                      </Badge>
                      {result.target.via.map((gateway) => (
                        <Badge key={gateway} variant="secondary">
                          via {gateway}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Findings
                  </h3>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleOpenSite}
                    disabled={result.label === "HIGH"}
                    variant={result.label === "HIGH" ? "outline" : "default"}
                  >
                    Open Site in New Tab
                  </Button>
                  
                  {result.label === "HIGH" && (
                    <p className="text-sm text-destructive font-medium flex items-center">
                      Blocked for safety
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {result.meta.ageDays !== null && (
              <div className="text-sm text-muted-foreground">
                Domain age: {result.meta.ageDays} days
              </div>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-2">
              <p className="text-muted-foreground">
                Enter a URL above to analyze it for potential security risks
              </p>
              <p className="text-sm text-muted-foreground">
                We'll check for redirects, domain age, and suspicious patterns
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-12 pt-6 text-sm text-muted-foreground text-center">
        <p>
          No storage by default • Built by Jason Wiggins •{" "}
          <a
            href="mailto:info@rusure.org"
            className="underline hover:text-foreground transition-colors"
          >
            info@rusure.org
          </a>
        </p>
      </footer>
    </div>
  );
}



