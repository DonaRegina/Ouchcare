import type { OrderStatus, UserRole } from "@/lib/types/domain";

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePriceHuf: number;
  heroImageUrl: string;
  material: string;
  isActive: boolean;
};

export type AdminOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantSize: string | null;
  quantity: number;
  unitPriceHuf: number;
  measurements: Record<string, unknown>;
  customSize: Record<string, unknown> | null;
};

export type AdminOrder = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalHuf: number;
  status: OrderStatus;
  stripeSessionId: string | null;
  createdAt: string;
  items: AdminOrderItem[];
};

export type AdminProductVariant = {
  id: string;
  productId: string;
  productName: string;
  size: string;
  additionalPriceCents: number;
  stock: number;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  clinicName: string | null;
  createdAt: string;
};

export type ProductFormValues = {
  slug: string;
  name: string;
  description: string;
  basePriceHuf: number;
  heroImageUrl: string;
  material: string;
  isActive: boolean;
};

export type OrderFormValues = {
  userId: string;
  totalHuf: number;
  status: OrderStatus;
  stripeSessionId: string;
};

export type UserFormValues = {
  fullName: string;
  email: string;
  role: UserRole;
  clinicName: string;
  password: string;
};
