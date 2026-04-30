import { NextResponse } from "next/server";

import { adminUserCreateSchema, adminUserUpdateSchema } from "@/lib/api/validation";
import { getAdminContext, loadAdminUsers } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const users = await loadAdminUsers(context.client);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = adminUserCreateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid user payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { data: createdUser, error: createError } = await context.client.auth.admin.createUser({
    email: payload.data.email,
    password: payload.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.data.fullName,
      role: payload.data.role ?? "customer",
    },
  });

  if (createError || !createdUser.user) {
    return NextResponse.json({ error: createError?.message ?? "Unable to create user" }, { status: 400 });
  }

  const { error: profileError } = await context.client.from("profiles").insert({
    id: createdUser.user.id,
    full_name: payload.data.fullName,
    email: payload.data.email,
    role: payload.data.role ?? "customer",
    clinic_name: payload.data.clinicName?.trim() || null,
  });

  if (profileError) {
    await context.client.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = adminUserUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid user payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { error: authError } = await context.client.auth.admin.updateUserById(payload.data.id, {
    email: payload.data.email,
    user_metadata: {
      full_name: payload.data.fullName,
      role: payload.data.role,
    },
    ...(payload.data.password ? { password: payload.data.password } : {}),
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await context.client
    .from("profiles")
    .update({
      full_name: payload.data.fullName,
      email: payload.data.email,
      role: payload.data.role,
      clinic_name: payload.data.clinicName?.trim() || null,
    })
    .eq("id", payload.data.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const id = String((await request.json().catch(() => null))?.id ?? new URL(request.url).searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const { error: profileError } = await context.client.from("profiles").delete().eq("id", id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: authError } = await context.client.auth.admin.deleteUser(id);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
