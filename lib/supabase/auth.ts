import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { UserRole } from "@/lib/types/domain";

const fallbackRole: UserRole = "customer";

const roleLandingPaths: Record<UserRole, string> = {
  customer: "/customer",
  vet: "/vet",
  admin: "/admin",
};

const protectedPathRules: Array<{ prefix: string; allowedRoles: UserRole[] }> = [
  {
    prefix: "/admin",
    allowedRoles: ["admin", "vet"],
  },
  {
    prefix: "/vet",
    allowedRoles: ["vet", "admin"],
  },
  {
    prefix: "/customer",
    allowedRoles: ["customer", "vet", "admin"],
  },
];

function isUserRole(role: unknown): role is UserRole {
  return role === "admin" || role === "vet" || role === "customer";
}

export function getRoleLandingPath(role: UserRole) {
  return roleLandingPaths[role];
}

export function getProtectedPathRoles(pathname: string) {
  return protectedPathRules.find((rule) => pathname.startsWith(rule.prefix))?.allowedRoles ?? null;
}

export function isProtectedPath(pathname: string) {
  return getProtectedPathRoles(pathname) !== null;
}

export function getRoleFromUser(user: User | null): UserRole {
  if (!user) {
    return fallbackRole;
  }

  const role =
    (user.app_metadata?.role as UserRole | undefined) ??
    (user.user_metadata?.role as UserRole | undefined);

  if (isUserRole(role)) {
    return role;
  }

  return fallbackRole;
}

export async function getResolvedUserRole(client: SupabaseClient<Database>, user: User | null) {
  if (!user) {
    return fallbackRole;
  }

  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const profileRole = profile?.role;

  if (isUserRole(profileRole)) {
    return profileRole;
  }

  return getRoleFromUser(user);
}

export function hasRole(user: User | null, allowed: UserRole[]) {
  const role = getRoleFromUser(user);
  return allowed.includes(role);
}

export function hasRoleAccess(role: UserRole, allowed: UserRole[]) {
  return allowed.includes(role);
}

export function getAllowedRedirectPath(role: UserRole) {
  return getRoleLandingPath(role);
}
