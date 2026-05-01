"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/store/cart-drawer";
import type { Session } from "@supabase/supabase-js";

/**
 * Navbar
 *
 * Renders the top-level navigation links including Sign In / Logout.
 *
 * Behavior:
 * - While checking auth state -> renders nothing (avoids flicker)
 * - Logged OUT:  Shop | Vet Advice | Sign In
 * - Logged IN:   Shop | Measurement Wizard | Dashboard | Vet Advice | Logout
 *
 * Sign In and Logout controls are rendered only inside the nav (once).
 */
export function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);

      // fetch role if logged in
      if (session) {
        fetch("/api/profile").then((r) => r.json()).then((data) => {
          setRole(data?.profile?.role ?? null);
        }).catch(() => {});
      }
    });

    // subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetch("/api/profile").then((r) => r.json()).then((data) => {
          setRole(data?.profile?.role ?? null);
        }).catch(() => {});
      } else {
        setRole(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // navigate home and refresh to update auth-based UI
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-2 text-sm font-medium"
    >
      {session ? (
        <>
          <Link
            href="/customer"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Dashboard
          </Link>

          <Link
            href="/shop"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Shop
          </Link>

          <Link
            href="/measurement-wizard"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Measurement Wizard
          </Link>

          <Link
            href="/faq"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Vet Advice
          </Link>

          {(role === "admin" || role === "vet") && (
            <Link
              href="/admin"
              className="rounded-full border border-transparent px-3 py-2 text-[#ff9f2f] transition-colors hover:border-[#ffe8c0] hover:bg-[#fff6e7] hover:text-[#d7700e] focus-visible:border-[#ffb13a] focus-visible:bg-[#fff6e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb13a] dark:text-[#ffb13a] dark:hover:border-[#92490640] dark:hover:bg-[#12525d] dark:hover:text-[#ffc157] dark:focus-visible:border-[#92490640] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#92490640]"
            >
              Admin
            </Link>
          )}

          {/* Logout rendered as a nav action so Sign In / Logout appear only inside the nav */}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border-[#37bfd0] bg-white px-3 py-2 text-[#166674] hover:bg-[#effcfe] dark:border-[#166674] dark:bg-[#0e414a] dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            href="/shop"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Shop
          </Link>

          <Link
            href="/faq"
            className="rounded-full border border-transparent px-3 py-2 text-slate-700 transition-colors hover:border-[#bff1f5] hover:bg-[#effcfe] hover:text-[#239fb1] focus-visible:border-[#96e7ee] focus-visible:bg-[#effcfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96e7ee] dark:focus-visible:border-[#1c7f90] dark:focus-visible:bg-[#12525d] dark:focus-visible:ring-[#1c7f90] dark:text-slate-200 dark:hover:border-[#166674] dark:hover:bg-[#0e414a]/50 dark:hover:text-[#96e7ee]"
          >
            Vet Advice
          </Link>

          {/* Sign in rendered inside nav as a link-button */}
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#37bfd0] bg-white px-3 py-2 text-[#166674] hover:bg-[#effcfe] dark:border-[#166674] dark:bg-[#0e414a] dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40"
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </>
      )}
      <CartDrawer />
    </nav>
  );
}