"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createVetArticleColumns } from "@/components/admin/vet-article-columns";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VetArticle } from "@/lib/types/domain";

type VetArticleFormValues = {
  slug: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
};

const emptyForm: VetArticleFormValues = {
  slug: "",
  question: "",
  answer: "",
  category: "General",
  sortOrder: 0,
  isPublished: true,
};

type VetArticleManagerProps = {
  articles: VetArticle[];
};

export function VetArticleManager({ articles }: VetArticleManagerProps) {
  const router = useRouter();
  const [editingArticle, setEditingArticle] = useState<VetArticle | null>(null);
  const [form, setForm] = useState<VetArticleFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingArticle) {
      setForm({
        slug: editingArticle.slug,
        question: editingArticle.question,
        answer: editingArticle.answer,
        category: editingArticle.category,
        sortOrder: editingArticle.sortOrder,
        isPublished: editingArticle.isPublished,
      });
      return;
    }

    setForm(emptyForm);
  }, [editingArticle]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/vet-articles", {
      method: editingArticle ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editingArticle ? { id: editingArticle.id } : {}),
        ...form,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to save article");
      return;
    }

    toast.success(editingArticle ? "Article updated" : "Article created");
    setEditingArticle(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function deleteArticle(article: VetArticle) {
    const response = await fetch("/api/admin/vet-articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: article.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to delete article");
      return;
    }

    if (editingArticle?.id === article.id) {
      setEditingArticle(null);
      setForm(emptyForm);
    }

    toast.success("Article deleted");
    router.refresh();
  }

  const columns = createVetArticleColumns({
    onEdit: setEditingArticle,
    onDelete: deleteArticle,
  });

  return (
    <section className="space-y-6" id="vet-advice">
      <Card>
        <CardHeader>
          <CardTitle>{editingArticle ? "Edit article" : "Create article"}</CardTitle>
          <CardDescription>
            Manage the public vet advice and FAQ content shown to customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="vet-article-question">Question</Label>
              <Input
                id="vet-article-question"
                value={form.question}
                onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vet-article-slug">Slug</Label>
              <Input
                id="vet-article-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vet-article-category">Category</Label>
              <Input
                id="vet-article-category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vet-article-sort">Sort order</Label>
              <Input
                id="vet-article-sort"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))}
                required
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="vet-article-answer">Answer</Label>
              <textarea
                id="vet-article-answer"
                value={form.answer}
                onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
                className="border-input bg-background min-h-40 rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium lg:col-span-2">
              <input
                checked={form.isPublished}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
              />
              Published
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingArticle ? "Update article" : "Create article"}
              </Button>
              {editingArticle ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingArticle(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vet advice table</CardTitle>
          <CardDescription>Search, edit, or reorder the public advice cards.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable columns={columns} data={articles} searchPlaceholder="Search articles..." />
        </CardContent>
      </Card>
    </section>
  );
}