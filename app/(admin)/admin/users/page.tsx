import { UserManager } from "@/components/admin/user-manager";
import { getAdminContext, loadAdminOverview } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const context = await getAdminContext();

  if ("error" in context) {
    return null;
  }

  const overview = await loadAdminOverview(context.client);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <UserManager users={overview.users} />
    </main>
  );
}
