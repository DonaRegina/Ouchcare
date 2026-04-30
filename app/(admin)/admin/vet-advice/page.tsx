import { VetArticleManager } from "@/components/admin/vet-article-manager";
import { getAdminContext } from "@/lib/supabase/admin";
import { loadVetArticles } from "@/lib/vet/articles";

export default async function AdminVetAdvicePage() {
  const context = await getAdminContext();

  if ("error" in context) {
    return null;
  }

  const articles = await loadVetArticles(context.client);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <VetArticleManager articles={articles} />
    </main>
  );
}