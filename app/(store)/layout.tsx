"use client";

import type React from "react";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-foreground bg-[#fffdf7] dark:bg-[#0a2e34]">
      {/* Paw pattern — light mode only */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-0"
        style={{ backgroundImage: "url('/patterns/paws.png')", backgroundSize: "540px auto", backgroundRepeat: "repeat" }}
      />
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(91,184,196,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,159,45,0.06),transparent_28%)] dark:bg-[radial-gradient(circle_at_top,rgba(55,191,208,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,177,58,0.06),transparent_28%)]" />
      <main
        id="main-content"
        className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
}
