import type { ColumnDef } from "@tanstack/react-table";
import { PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants/mock-data";
import type { AdminOrder, AdminProduct, AdminUser } from "@/lib/types/admin";

type RowAction<T> = {
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
};

export function createProductColumns({ onEdit, onDelete }: RowAction<AdminProduct>): ColumnDef<AdminProduct>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
    },
    {
      accessorKey: "material",
      header: "Material",
    },
    {
      accessorKey: "basePriceHuf",
      header: "Base price",
      cell: ({ row }) => CURRENCY.format(row.original.basePriceHuf),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "outline"}>{row.original.isActive ? "Active" : "Archived"}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => onEdit(row.original)}>
            <PencilLine className="size-3.5" />
            <span className="sr-only">Edit product</span>
          </Button>
          <Button size="icon-sm" variant="destructive" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete product</span>
          </Button>
        </div>
      ),
    },
  ];
}

export function createOrderColumns({ onEdit, onDelete }: RowAction<AdminOrder>): ColumnDef<AdminOrder>[] {
  return [
    {
      accessorKey: "id",
      header: "Order ID",
    },
    {
      accessorKey: "userName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.userName}</div>
          <div className="text-muted-foreground text-xs">{row.original.userEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
    },
    {
      accessorKey: "totalHuf",
      header: "Total",
      cell: ({ row }) => CURRENCY.format(row.original.totalHuf),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => onEdit(row.original)}>
            <PencilLine className="size-3.5" />
            <span className="sr-only">Edit order</span>
          </Button>
          <Button size="icon-sm" variant="destructive" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete order</span>
          </Button>
        </div>
      ),
    },
  ];
}

export function createUserColumns({ onEdit, onDelete }: RowAction<AdminUser>): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
    },
    {
      accessorKey: "clinicName",
      header: "Clinic",
      cell: ({ row }) => row.original.clinicName ?? "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => onEdit(row.original)}>
            <PencilLine className="size-3.5" />
            <span className="sr-only">Edit user</span>
          </Button>
          <Button size="icon-sm" variant="destructive" onClick={() => onDelete(row.original)}>
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete user</span>
          </Button>
        </div>
      ),
    },
  ];
}
