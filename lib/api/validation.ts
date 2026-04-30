import { z } from "zod";

export const publicUserRoleSchema = z.enum(["customer", "vet"]);

export const publicProfileUpsertSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120, "Full name is too long.").optional(),
  role: publicUserRoleSchema.optional(),
  clinicName: z.string().trim().min(1).max(120).optional().nullable(),
});

export const measurementPayloadSchema = z.object({
  petName: z.string().trim().min(1, "Pet name is required.").max(120, "Pet name is too long."),
  breed: z.string().trim().max(120).optional().default(""),
  neckCm: z.coerce.number().finite().positive().min(10).max(80),
  chestCm: z.coerce.number().finite().positive().min(20).max(140),
  backLengthCm: z.coerce.number().finite().positive().min(15).max(140),
  legGirthCm: z.coerce.number().finite().positive().min(8).max(80),
});

export const publicProductCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(120, "Slug is too long.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens only."),


    
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  description: z.string().trim().min(1, "Description is required.").max(2000, "Description is too long."),
  basePriceHuf: z.coerce.number().int().min(0, "Price cannot be negative.").max(1000000, "Price is too high."),
  material: z.string().trim().min(1, "Material is required.").max(120, "Material is too long."),
  heroImageUrl: z.string().trim().min(1, "Hero image URL is required.").max(500, "Hero image URL is too long."),
});

const adminProductUpsertShape = z.object({
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  basePriceHuf: z.coerce.number().int().min(0).max(1000000).optional(),
  heroImageUrl: z.string().trim().min(1).max(500).optional(),
  material: z.string().trim().min(1).max(120).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const adminProductUpsertSchema = adminProductUpsertShape.refine(
  (value) => Object.keys(value).length > 0,
  "At least one product field is required.",
);

export const adminProductUpdateSchema = adminProductUpsertShape
  .extend({ id: z.string().trim().min(1, "Product id is required.") })
  .refine(
    (value) => Object.keys(value).some((key) => key !== "id"),
    "At least one product field is required.",
  );

export const adminProductCreateSchema = publicProductCreateSchema.extend({
  isActive: z.coerce.boolean().optional(),
});

export const adminUserCreateSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  email: z.string().trim().email("A valid email address is required."),
  role: z.enum(["admin", "vet", "customer"]).optional(),
  clinicName: z.string().trim().min(1).max(120).optional().nullable(),
  password: z.string().trim().min(8, "Password must be at least 8 characters."),
});

export const adminUserUpdateSchema = z.object({
  id: z.string().trim().min(1, "User id is required."),
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  email: z.string().trim().email("A valid email address is required."),
  role: z.enum(["admin", "vet", "customer"]),
  clinicName: z.string().trim().min(1).max(120).optional().nullable(),
  password: z.string().trim().min(8, "Password must be at least 8 characters.").optional(),
});

export const adminOrderCreateSchema = z.object({
  userId: z.string().trim().min(1, "User id is required."),
  totalHuf: z.coerce.number().int().min(0, "Order total cannot be negative."),
  status: z.enum(["pending", "paid", "processing", "shipped", "cancelled"]).optional(),
  stripeSessionId: z.string().trim().min(1).nullable().optional(),
});

export const adminOrderUpdateSchema = z.object({
  id: z.string().trim().min(1, "Order id is required."),
  userId: z.string().trim().min(1, "User id is required.").optional(),
  totalHuf: z.coerce.number().int().min(0, "Order total cannot be negative.").optional(),
  status: z.enum(["pending", "paid", "processing", "shipped", "cancelled"]).optional(),
  stripeSessionId: z.string().trim().min(1).nullable().optional(),
});

export const checkoutItemSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPriceHuf: z.coerce.number().int().min(0),
  size: z.string().trim().min(1),
  imageUrl: z.string().trim().optional(),
  measurements: z.record(z.string(), z.unknown()).optional(),
});

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "At least one checkout item is required."),
});

export const vetArticleCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(120, "Slug is too long.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens only."),
  question: z.string().trim().min(1, "Question is required.").max(220, "Question is too long."),
  answer: z.string().trim().min(1, "Answer is required.").max(4000, "Answer is too long."),
  category: z.string().trim().min(1).max(120).optional().default("General"),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional().default(0),
  isPublished: z.coerce.boolean().optional().default(true),
});

export const vetArticleUpdateSchema = vetArticleCreateSchema.extend({
  id: z.string().trim().min(1, "Article id is required."),
});

export function parseJsonBody<T>(body: unknown, schema: z.ZodType<T>) {
  return schema.safeParse(body);
}