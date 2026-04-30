import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

import { getAllowedRedirectPath, getResolvedUserRole, getRoleLandingPath, getProtectedPathRoles, isProtectedPath } from "@/lib/supabase/auth";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  const role = await getResolvedUserRole(supabase, user);
  const allowedRoles = getProtectedPathRoles(pathname);

  if (allowedRoles && !allowedRoles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = getAllowedRedirectPath(role) ?? getRoleLandingPath(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
