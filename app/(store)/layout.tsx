"use client";

import type React from "react";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(91,184,196,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,159,45,0.12),transparent_26%),linear-gradient(180deg,#fff8f1_0%,#ffffff_48%,#f2fbfc_100%)] text-foreground">
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
}
