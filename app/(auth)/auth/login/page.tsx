"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getRoleLandingPath } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirectTo") ?? "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const response = await fetch("/api/profile", { cache: "no-store" });
    const payload = response.ok ? await response.json() : null;
    const role = payload?.profile?.role ?? "customer";
    const target = redirectTo || getRoleLandingPath(role);

    setLoading(false);
    router.replace(target);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your OUCHCare workspace"
      description="Use one account to manage recovery shopping, vet guidance, and the admin console. Role-aware redirects send each user to the right workspace after login."
      note="Sign in once, then move into the dashboard that matches your role."
      highlights={[
        {
          title: "Customer recovery tools",
          description: "Manage fitting, checkout, and order tracking from your protected customer area.",
        },
        {
          title: "Vet review space",
          description: "Review case notes and fitting guidance in a vet-only workspace.",
        },
      ]}
    >
      <Card className="border-black/5 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <CardHeader className="space-y-3 pb-4">
          <CardTitle className="text-3xl tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-base">
            Continue with your customer, vet, or admin account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="Enter your password" />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
            ) : null}

            <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Need an account?</span>
            <Link href="/auth/signup" className="font-medium text-slate-950 underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}