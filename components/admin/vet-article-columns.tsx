import type { ColumnDef } from "@tanstack/react-table";
import { PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VetArticle } from "@/lib/types/domain";

type RowAction = {
  onEdit: (row: VetArticle) => void;
  onDelete: (row: VetArticle) => void;
};

export function createVetArticleColumns({ onEdit, onDelete }: RowAction): ColumnDef<VetArticle>[] {
  return [
    {
      accessorKey: "question",
      header: "Question",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? "default" : "outline"}>{row.original.isPublished ? "Published" : "Draft"}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => onEdit(row.original)}>
            <PencilLine className="size-3.5" />
            <span className="sr-only">Edit article</span>
          </Button>
          <Button size="icon-sm" variant="destructive" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete article</span>
          </Button>
        </div>
      ),
    },
  ];
}