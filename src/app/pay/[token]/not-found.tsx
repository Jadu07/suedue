import React from "react";

export default function PaymentNotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xl text-center">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-sm tracking-tight">INVALID LINK</h1>
        <p className="text-sm text-ink-mute">This payment link is invalid or has expired.</p>
      </div>
    </div>
  );
}
