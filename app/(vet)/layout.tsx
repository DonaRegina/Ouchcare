import { redirect } from "next/navigation";

import { getAllowedRedirectPath, getResolvedUserRole, hasRoleAccess } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function VetLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/vet");
  }

  const role = await getResolvedUserRole(supabase, user);

  if (!hasRoleAccess(role, ["vet", "admin"])) {
    redirect(getAllowedRedirectPath(role));
  }

  return <>{children}</>;
}