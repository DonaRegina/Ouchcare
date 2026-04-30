export type UserRole = "customer" | "vet" | "admin";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "CUSTOM";

export type PetMeasurements = {
  neckCm: number;
  chestCm: number;
  backLengthCm: number;
  legGirthCm: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePriceHuf: number;
  heroImageUrl: string;
  material: string;
  availableSizes: ProductSize[];
  isActive: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: ProductSize;
  additionalPriceHuf: number;
  stock: number;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  size: ProductSize;
  unitPriceHuf: number;
  quantity: number;
  imageUrl: string;
  measurements?: PetMeasurements;
};

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "cancelled";

export type Order = {
  id: string;
  userId: string;
  totalHuf: number;
  status: OrderStatus;
  stripeSessionId: string | null;
  createdAt: string;
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  clinicName: string | null;
  createdAt: string;
};

export type MeasurementStep = "neck" | "chest" | "back" | "leg";

export type WizardField = {
  key: keyof PetMeasurements;
  step: MeasurementStep;
  label: string;
  helperText: string;
  exampleImageUrl: string;
  min: number;
  max: number;
};

export type VetArticle = {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};
