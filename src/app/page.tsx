import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <main className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Paste a link. Get the truth.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Unwraps hidden redirects, checks domain history, and flags risky
            look-alikes — before you click.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/check">
            <Button size="lg" className="text-lg px-8 py-6 h-auto">
              Check a Link
            </Button>
          </Link>
        </div>

        <div className="pt-12 text-sm text-muted-foreground space-y-2">
          <p>No tracking • No storage • Privacy-first</p>
        </div>
      </main>

      <footer className="mt-auto pt-12 pb-6 text-sm text-muted-foreground text-center">
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
