"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/data-table";
import { createUserColumns } from "@/components/admin/columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminUser, UserFormValues } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/domain";

const userRoles: UserRole[] = ["customer", "vet", "admin"];

const emptyForm: UserFormValues = {
  fullName: "",
  email: "",
  role: "customer",
  clinicName: "",
  password: "",
};

type UserManagerProps = {
  users: AdminUser[];
};

export function UserManager({ users }: UserManagerProps) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setForm({
        fullName: editingUser.fullName,
        email: editingUser.email,
        role: editingUser.role,
        clinicName: editingUser.clinicName ?? "",
        password: "",
      });
      return;
    }

    setForm(emptyForm);
  }, [editingUser]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/users", {
      method: editingUser ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editingUser ? { id: editingUser.id } : {}),
        ...form,
        password: form.password || undefined,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to save user");
      return;
    }

    toast.success(editingUser ? "User updated" : "User created");
    setEditingUser(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function deleteUser(user: AdminUser) {
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to delete user");
      return;
    }

    if (editingUser?.id === user.id) {
      setEditingUser(null);
      setForm(emptyForm);
    }

    toast.success("User deleted");
    router.refresh();
  }

  const columns = createUserColumns({
    onEdit: setEditingUser,
    onDelete: deleteUser,
  });

  return (
    <section className="space-y-6" id="users">
      <Card>
        <CardHeader>
          <CardTitle>{editingUser ? "Edit user" : "Create user"}</CardTitle>
          <CardDescription>
            Create auth-backed profiles, assign admin/vet access, and keep clinic details in sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="user-name">Full name</Label>
              <Input
                id="user-name"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-clinic">Clinic</Label>
              <Input
                id="user-clinic"
                value={form.clinicName}
                onChange={(event) => setForm((current) => ({ ...current, clinicName: event.target.value }))}
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="user-password">{editingUser ? "Password (optional)" : "Password"}</Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required={!editingUser}
                minLength={editingUser ? undefined : 8}
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingUser ? "Update user" : "Create user"}
              </Button>
              {editingUser ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingUser(null);
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
          <CardTitle>Users table</CardTitle>
          <CardDescription>Manage the profile table that powers role checks and admin access.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />
        </CardContent>
      </Card>
    </section>
  );
}
