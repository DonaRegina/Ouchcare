import { NextResponse } from "next/server";

import { vetArticleCreateSchema, vetArticleUpdateSchema } from "@/lib/api/validation";
import { getAdminContext } from "@/lib/supabase/admin";
import { loadVetArticles } from "@/lib/vet/articles";

export async function GET() {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const articles = await loadVetArticles(context.client);
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = vetArticleCreateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid article payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { error } = await context.client.from("vet_articles").insert({
    slug: payload.data.slug,
    question: payload.data.question,
    answer: payload.data.answer,
    category: payload.data.category,
    sort_order: payload.data.sortOrder,
    is_published: payload.data.isPublished,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = vetArticleUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid article payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    slug: payload.data.slug,
    question: payload.data.question,
    answer: payload.data.answer,
    category: payload.data.category,
    sort_order: payload.data.sortOrder,
    is_published: payload.data.isPublished,
  };

  const { error } = await context.client.from("vet_articles").update(update).eq("id", payload.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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
    return NextResponse.json({ error: "Article id is required" }, { status: 400 });
  }

  const { error } = await context.client.from("vet_articles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}