import { redirect } from "next/navigation";

import { getAdminContext } from "@/lib/supabase/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminContext();

  if ("error" in context) {
    if (context.error.status === 401) {
      redirect("/auth/login?redirectTo=/admin");
    }

    redirect("/customer");
  }

  return <>{children}</>;
}
