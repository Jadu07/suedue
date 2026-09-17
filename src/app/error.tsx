"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xl text-center">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-sm tracking-tight">INVALID LINK</h1>
        <p className="text-sm text-ink-mute">This payment link is invalid or has expired.</p>
      </div>
    </div>
  );
}
