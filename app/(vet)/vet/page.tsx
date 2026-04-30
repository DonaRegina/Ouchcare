import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VetDashboardPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-6 py-10">
      <section className="w-full space-y-8">
        <div className="rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#0e414a] via-[#239fb1] to-[#ff9f2f] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <Badge className="rounded-full border-white/10 bg-white/15 px-4 py-1 text-white">Vet workspace</Badge>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/75">Protected route</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Review fit guidance and recovery notes from one clinical workspace.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/74">
                Vet users can keep support, sizing advice, and account data separate from customer and admin areas.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
              <p className="text-sm font-medium text-white/75">Next action</p>
              <p className="mt-2 text-xl font-semibold">Check clinic profile details</p>
              <Button asChild className="mt-4 w-full rounded-xl bg-white text-[#239fb1] hover:bg-white/90">
                <Link href="/admin">Open admin tools</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Clinical notes",
              description: "Keep care context and fit guidance ready for the next consultation.",
            },
            {
              title: "Role access",
              description: "Vet accounts can reach customer-facing content and the admin console when needed.",
            },
            {
              title: "Fitting support",
              description: "Use recovery clothing details to guide safer post-op wear.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-[#dff8fb] bg-white/90">
              <CardHeader>
                <CardTitle className="text-[#239fb1]">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-6 text-sm leading-6 text-slate-600">{item.description}</CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/faq">Open vet advice</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/customer">Customer area</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}