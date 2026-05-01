import { NextResponse } from "next/server";

import { publicProfileUpsertSchema, publicUserRoleSchema } from "@/lib/api/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getRoleFromUser } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getPublicProfileRole(role: unknown) {
  if (role === "admin" || role === "vet" || role === "customer") {
    return role;
  }
  return null;
}


export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  const role = getPublicProfileRole(profile?.role) ?? getRoleFromUser(user);

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      role,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = publicProfileUpsertSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid profile payload.", issues: parsedBody.error.flatten() }, { status: 400 });
  }

  const fullName = (parsedBody.data.fullName ?? user.user_metadata?.full_name ?? "").trim();
  const currentRole = getRoleFromUser(user);
  const requestedRole = getPublicProfileRole(parsedBody.data.role);
  const role = currentRole === "admin" ? currentRole : requestedRole ?? currentRole;
  const clinicName = parsedBody.data.clinicName?.trim() || null;

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      email: user.email ?? "",
      role,
      clinic_name: clinicName,
    },
    { onConflict: "id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      role,
      fullName,
      clinicName,
    },
  });
}
