"use client";

import { useEffect } from "react";
import { Flame, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[abem-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
        <Flame className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="display-2 mt-6 text-cream">Something burned.</h1>
      <p className="lead mt-3 max-w-md">
        An unexpected error occurred in the kitchen. Our team has been notified — try again, and if it
        persists, we&apos;ll make it right.
      </p>
      <button onClick={reset} className="btn-gold mt-8">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
