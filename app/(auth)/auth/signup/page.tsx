"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getRoleLandingPath } from "@/lib/supabase/auth";
import type { UserRole } from "@/lib/types/domain";

type SignupRole = Exclude<UserRole, "admin">;

function normalizeSignupRole(value: string): SignupRole {
  return value === "vet" ? "vet" : "customer";
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [role, setRole] = useState<SignupRole>("customer");

  const redirectTo = searchParams.get("redirectTo") ?? "";

  const nextPath = useMemo(() => {
    if (redirectTo.startsWith("/")) {
      return redirectTo;
    }

    return getRoleLandingPath(role);
  }, [redirectTo, role]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const clinicName = String(form.get("clinicName") ?? "").trim();
    const selectedRole = normalizeSignupRole(String(form.get("role") ?? role));

    setLoading(true);

    const supabase = createClient();
    const redirectBase = `${window.location.origin}/api/auth/callback`;
    const emailRedirectTo = new URL(redirectBase);
    emailRedirectTo.searchParams.set("next", nextPath);
    emailRedirectTo.searchParams.set("fullName", fullName);
    emailRedirectTo.searchParams.set("role", selectedRole);
    if (clinicName) {
      emailRedirectTo.searchParams.set("clinicName", clinicName);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
          clinic_name: clinicName || null,
        },
        emailRedirectTo: emailRedirectTo.toString(),
      },
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          role: selectedRole,
          clinicName,
        }),
      });

      setLoading(false);
      router.replace(nextPath);
      return;
    }

    setLoading(false);
    setNotice("Account created. Check your email to confirm the account, then you will be sent to your workspace.");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Set up your OUCHCare profile"
      description="Start as a customer or vet. Admin access is assigned separately, so the public signup stays safe while the dashboards stay role-aware."
      note="Vet accounts can include a clinic name. Admin users should be provisioned through the admin console."
      highlights={[
        {
          title: "Customer access",
          description: "Browse products, save measurements, and manage orders in a protected customer workspace.",
        },
        {
          title: "Vet collaboration",
          description: "Share guidance and fit recommendations from a vet-only dashboard.",
        },
      ]}
    >
      <Card className="border-black/5 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <CardHeader className="space-y-3 pb-4">
          <CardTitle className="text-3xl tracking-tight">Create account</CardTitle>
          <CardDescription className="text-base">
            Register a customer or vet account. Admin access is handled by an existing admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" placeholder="Jamie Taylor" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Create a secure password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Account type</Label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(event) => setRole(normalizeSignupRole(event.target.value))}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950/10"
              >
                <option value="customer">Customer</option>
                <option value="vet">Vet</option>
              </select>
            </div>
            {role === "vet" ? (
              <div className="grid gap-2">
                <Label htmlFor="clinicName">Clinic name</Label>
                <Input id="clinicName" name="clinicName" autoComplete="organization" placeholder="Northside Animal Clinic" />
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
            ) : null}
            {notice ? (
              <p className="rounded-xl border border-[#bff1f5] bg-[#effcfe] px-4 py-3 text-sm text-[#166674]">{notice}</p>
            ) : null}

            <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Already have an account?</span>
            <Link href="/auth/login" className="font-medium text-slate-950 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
