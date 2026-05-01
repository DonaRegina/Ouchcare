import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function StoreHomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/customer");
  }

  return (
    <section className="space-y-8">
      <Card className="border-[#bff1f5] bg-white/95 shadow-sm dark:border-[#1c7f90] dark:bg-[#0e414a]/90">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight text-[#ff9f2f] dark:text-[#ffc157]">
            {APP_NAME}: Recovery Clothing That Fits Healing Pets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="max-w-3xl text-base leading-relaxed text-[#166674] dark:text-[#96e7ee]">
            Purpose-built post-operative garments for dogs and cats, designed to reduce licking,
            protect sutures, and keep your pet comfortable during recovery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#239fb1] text-white hover:bg-[#1c7f90] dark:bg-[#37bfd0] dark:text-[#0e414a] dark:hover:bg-[#239fb1]">
              <Link href="/shop">Browse products</Link>
            </Button>
            <Button asChild variant="outline" className="border-[#ff9f2f] text-[#ff9f2f] hover:bg-[#fff6e7] dark:border-[#ffb13a] dark:text-[#ffb13a] dark:hover:bg-[#12525d]">
              <Link href="/measurement-wizard">Start measurement wizard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#bff1f5] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#63d4df]">Custom sizing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#166674] dark:text-[#96e7ee]/80">
            Tailored fit options using neck, chest, back length, and leg girth measurements.
          </CardContent>
        </Card>
        <Card className="border-[#bff1f5] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#63d4df]">Vet collaboration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#166674] dark:text-[#96e7ee]/80">
            Role-based access enables veterinarians to share care guidance and fit suggestions.
          </CardContent>
        </Card>
        <Card className="border-[#bff1f5] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]/80">
          <CardHeader>
            <CardTitle className="text-[#239fb1] dark:text-[#63d4df]">Secure checkout</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[#166674] dark:text-[#96e7ee]/80">
            Stripe-ready checkout flow and Supabase-backed order tracking for production use.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
