import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getResolvedUserRole } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminOrder, AdminProduct, AdminProductVariant, AdminUser } from "@/lib/types/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { UserRole } from "@/lib/types/domain";


export type AdminContext = {
  userId: string;
  role: UserRole;
  client: SupabaseClient<Database>;
};

export type AdminError = {
  status: number;
  message: string;
};

type AdminContextResult = AdminContext | { error: AdminError };

export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAdminContext(): Promise<AdminContextResult> {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { error: { status: 401, message: "Unauthorized" } };
  }

  const client = createServiceRoleClient();
  const role = await getResolvedUserRole(client, user);

  if (role !== "admin" && role !== "vet") {
    return { error: { status: 403, message: "Forbidden" } };
  }

  return {
    userId: user.id,
    role,
    client,
  };
}

export async function loadAdminProducts(client: SupabaseClient<Database>): Promise<AdminProduct[]> {
  const { data, error } = await client
    .from("products")
    .select("id, slug, name, description, price_huf, hero_image_url, material, is_active")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    basePriceHuf: product.price_huf,
    heroImageUrl: product.hero_image_url,
    material: product.material,
    isActive: product.is_active,
  
  }));
}

export async function loadAdminProductVariants(client: SupabaseClient<Database>): Promise<AdminProductVariant[]> {
  const { data, error } = await client
    .from("product_variants")
    .select("id, product_id, size, additional_price_cents, stock, products(name)")
    .order("size");

  if (error || !data) {
    return [];
  }

  return data.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    productName: Array.isArray(v.products) ? v.products[0]?.name ?? "Unknown" : v.products?.name ?? "Unknown",
    size: v.size,
    additionalPriceCents: v.additional_price_cents,
    stock: v.stock,
  }));
}

export async function loadAdminOrders(client: SupabaseClient<Database>): Promise<AdminOrder[]> {
  const { data, error } = await client
    .from("orders")
    .select("id, user_id, total_huf, status, stripe_session_id, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const userIds = [...new Set(data.map((order) => order.user_id))];
  const profileResult = userIds.length
    ? await client.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string; email: string }> };

  const profileMap = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));

  // Load order items with product names and measurements
  const orderIds = data.map((o) => o.id);
  const orderItemsResult = orderIds.length
    ? await client
        .from("order_items")
        .select("id, order_id, product_id, variant_id, quantity, unit_price_huf, measurements, custom_size, products(name), product_variants(size)")
        .in("order_id", orderIds)
    : { data: [] };

  const orderItemsByOrderId = new Map<string, typeof orderItemsResult.data>();
  for (const item of (orderItemsResult.data ?? []) as any[]) {
    const existing = orderItemsByOrderId.get(item.order_id) ?? [];
    existing.push(item);
    orderItemsByOrderId.set(item.order_id, existing);
  }

  return data.map((order) => {
    const profile = profileMap.get(order.user_id);
    const rawItems = (orderItemsByOrderId.get(order.id) ?? []) as any[];

    return {
      id: order.id,
      userId: order.user_id,
      userName: profile?.full_name ?? "Unknown user",
      userEmail: profile?.email ?? "Unavailable",
      totalHuf: order.total_huf ?? 0,
      status: order.status as AdminOrder["status"],
      stripeSessionId: order.stripe_session_id,
      createdAt: order.created_at,
      items: rawItems.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: Array.isArray(item.products) ? item.products[0]?.name ?? "Product" : item.products?.name ?? "Product",
        variantSize: Array.isArray(item.product_variants) ? item.product_variants[0]?.size ?? null : item.product_variants?.size ?? null,
        quantity: item.quantity,
        unitPriceHuf: item.unit_price_huf,
        measurements: item.measurements ?? {},
        customSize: item.custom_size ?? null,
      })),
    };
  });
}

export async function loadAdminUsers(client: SupabaseClient<Database>): Promise<AdminUser[]> {
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, email, role, clinic_name, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    clinicName: profile.clinic_name,
    createdAt: profile.created_at,
  }));
}

export async function loadAdminOverview(client: SupabaseClient<Database>) {
  const [products, orders, users, variants] = await Promise.all([
    loadAdminProducts(client),
    loadAdminOrders(client),
    loadAdminUsers(client),
    loadAdminProductVariants(client),
  ]);

  return {
    products,
    orders,
    users,
    variants,
    stats: {
      activeProducts: products.filter((product) => product.isActive).length,
      totalProducts: products.length,
      paidOrders: orders.filter((order) => order.status === "paid").length,
      totalOrders: orders.length,
      adminUsers: users.filter((user) => user.role === "admin").length,
      vetUsers: users.filter((user) => user.role === "vet").length,
      customOrders: orders.filter((o) => o.items.some((i) => i.variantSize === "CUSTOM")).length,
    },
  };
}
