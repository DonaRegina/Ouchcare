import { NextResponse } from "next/server";

import { publicUserRoleSchema } from "@/lib/api/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getRoleFromUser, getRoleLandingPath } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getPublicProfileRole(role: unknown) {
  const parsedRole = publicUserRoleSchema.safeParse(role);

  return parsedRole.success ? parsedRole.data : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const fullName = requestUrl.searchParams.get("fullName");
  const role = getPublicProfileRole(requestUrl.searchParams.get("role"));
  const clinicName = requestUrl.searchParams.get("clinicName");

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const currentRole = getRoleFromUser(user);
      const resolvedRole = currentRole === "admin" ? currentRole : role ?? currentRole;
      const adminClient = createServiceRoleClient();
      const profileFullName = fullName?.trim() || user.user_metadata?.full_name || user.email || "OUCHCare user";

      await adminClient.from("profiles").upsert(
        {
          id: user.id,
          full_name: profileFullName,
          email: user.email ?? "",
          role: resolvedRole,
          clinic_name: clinicName?.trim() || null,
        },
        { onConflict: "id" },
      );

      const redirectPath = next ?? getRoleLandingPath(resolvedRole);

      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.redirect(new URL(next ?? "/", request.url));
}
