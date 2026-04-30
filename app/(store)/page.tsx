import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants/mock-data";

export default function StoreHomePage() {
  return (
    <section className="space-y-8">
      <Card className="border-[#bff1f5] bg-white/95 text-slate-900 shadow-sm dark:border-[#166674] dark:bg-slate-950/90 dark:text-slate-50">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight text-[#ff9f2f] dark:text-[#ffc157]">
            {APP_NAME}: Recovery Clothing That Fits Healing Pets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <p className="max-w-3xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
            Purpose-built post-operative garments for dogs and cats, designed to reduce licking,
            protect sutures, and keep your pet comfortable during recovery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/measurement-wizard">Start measurement wizard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#dff8fb] bg-white/90 dark:border-[#166674]/60 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#96e7ee]">Custom sizing</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-slate-700 dark:text-slate-300">
            Tailored fit options using neck, chest, back length, and leg girth measurements.
          </CardContent>
        </Card>
        <Card className="border-[#dff8fb] bg-white/90 dark:border-[#166674]/60 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#96e7ee]">Vet collaboration</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-slate-700 dark:text-slate-300">
            Role-based access enables veterinarians to share care guidance and fit suggestions.
          </CardContent>
        </Card>
        <Card className="border-[#dff8fb] bg-white/90 dark:border-[#166674]/60 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#96e7ee]">Secure checkout</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-slate-700 dark:text-slate-300">
            Stripe-ready checkout flow and Supabase-backed order tracking for production use.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
