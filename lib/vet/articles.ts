import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { VetArticle } from "@/lib/types/domain";

type LoadVetArticlesOptions = {
  publishedOnly?: boolean;
};

export async function loadVetArticles(
  client: SupabaseClient<Database>,
  options: LoadVetArticlesOptions = {},
): Promise<VetArticle[]> {
  let query = client
    .from("vet_articles")
    .select("id, slug, question, answer, category, sort_order, is_published, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options.publishedOnly) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((article) => ({
    id: article.id,
    slug: article.slug,
    question: article.question,
    answer: article.answer,
    category: article.category,
    sortOrder: article.sort_order,
    isPublished: article.is_published,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  }));
}