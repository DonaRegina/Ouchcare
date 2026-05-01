import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadVetArticles } from "@/lib/vet/articles";
import { VET_FAQ } from "@/lib/constants/mock-data";

function stripHtml(text: string) {
  return text.replace(/<[^>]*>/g, "");
}

export default async function FaqPage() {
  const supabase = await createServerSupabaseClient();
  const articles = await loadVetArticles(supabase, { publishedOnly: true });
  const content = articles.length > 0
    ? articles.map((article) => ({ q: article.question, a: article.answer, category: article.category }))
    : VET_FAQ.map((item) => ({ ...item, category: "General" }));

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-[#ff9f2f] dark:text-[#ffc157]">Vet Advice & FAQ</h1>
      <p className="max-w-2xl text-[#166674] dark:text-[#96e7ee]">
        Educational guidance prepared with veterinary recovery best practices. This does not replace
        direct clinical instructions.
      </p>
      <p className="text-sm text-[#1c7f90] dark:text-[#96e7ee]/60">
        Content is managed in the admin vet advice CMS and falls back to the built-in starter copy if no published articles exist yet.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {content.map((item) => (
          <Card key={item.q} className="border-[#bff1f5] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]">
            <CardHeader>
              <CardTitle className="text-lg text-[#239fb1] dark:text-[#63d4df]">{item.q}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-[#166674] dark:text-[#96e7ee]/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9f2f] dark:text-[#ffb13a]">{item.category}</p>
              <p>{stripHtml(item.a)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
