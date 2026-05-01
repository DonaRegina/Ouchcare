import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  getAllowedRedirectPath,
  getResolvedUserRole,
  hasRoleAccess,
} from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/customer");
  }

  const role = await getResolvedUserRole(supabase, user);

  if (!hasRoleAccess(role, ["customer", "vet", "admin"])) {
    redirect(getAllowedRedirectPath(role));
  }

  return (
    <div className="relative min-h-screen text-foreground flex flex-col bg-[#fffdf7] dark:bg-[#0a2e34]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-0"
        style={{ backgroundImage: "url('/patterns/paws.png')", backgroundSize: "540px auto", backgroundRepeat: "repeat" }}
      />
      <main
        id="main-content"
        className="relative flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
}
