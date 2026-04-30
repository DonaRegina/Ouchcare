import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";

import { OuchLogo } from "@/components/brand/ouch-logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  highlights: Array<{ title: string; description: string }>;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, note, highlights, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#fff7ef_0%,#fffdf7_45%,#edf9fa_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,159,45,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(91,184,196,0.14),transparent_26%),radial-gradient(circle_at_center,rgba(15,23,42,0.04),transparent_28%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden flex-col justify-between border-r border-black/5 px-10 py-12 lg:flex">
          <div className="max-w-xl space-y-8">
            <Link href="/" className="inline-flex w-fit">
              <OuchLogo compact className="items-start gap-0" />
            </Link>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#239fb1]">{eyebrow}</p>
              <h1 className="max-w-lg text-5xl font-semibold tracking-tight text-[#ff9f2f]">{title}</h1>
              <p className="max-w-xl text-lg leading-8 text-slate-700">{description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#239fb1] text-white">
                    {item.title.includes("Vet") ? <Stethoscope className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <h2 className="text-lg font-semibold text-[#ff9f2f]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-[#239fb1] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-white/75">
              <Sparkles className="h-4 w-4" />
              Protected access
            </div>
            <p className="mt-4 text-base leading-7 text-white/82">{note}</p>
            <div className="mt-6 flex items-center gap-3 text-sm text-white/72">
              <ArrowRight className="h-4 w-4" />
              Customer, vet, and admin routes stay locked by role.
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="lg:hidden">
              <Link href="/" className="inline-flex">
                <OuchLogo compact className="items-start gap-0" />
              </Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}