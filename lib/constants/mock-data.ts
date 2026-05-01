import type { Order, Product, Profile, WizardField } from "@/lib/types/domain";

export const APP_NAME = "OUCHCare";

export const CURRENCY = new Intl.NumberFormat("hu-HU", {
  style: "currency",
  currency: "HUF",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const WIZARD_FIELDS: WizardField[] = [
  {
    key: "neckCm",
    step: "neck",
    label: "Neck circumference (cm)",
    helperText: "Measure where the collar naturally sits.",
    exampleImageUrl: "/measurements/neck.svg",
    min: 10,
    max: 80,
  },
  {
    key: "chestCm",
    step: "chest",
    label: "Chest circumference (cm)",
    helperText: "Wrap tape around the widest part behind front legs.",
    exampleImageUrl: "/measurements/chest.svg",
    min: 20,
    max: 120,
  },
  {
    key: "backLengthCm",
    step: "back",
    label: "Back length (cm)",
    helperText: "From shoulder blades to base of tail.",
    exampleImageUrl: "/measurements/back.svg",
    min: 15,
    max: 120,
  },
  {
    key: "legGirthCm",
    step: "leg",
    label: "Front leg girth (cm)",
    helperText: "Measure around upper front leg where sleeve rests.",
    exampleImageUrl: "/measurements/leg.svg",
    min: 8,
    max: 70,
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-recover-suit",
    slug: "recover-suit",
    name: "Medical Recovery Vest for Pets",
    description:
      "Veterinarian-approved recovery vest for cats and dogs that need shoulder, upper neck, and rib coverage without a full-body suit.",
    basePriceHuf: 300000,
    heroImageUrl: "/products/medical-recovery-vest.jpg",
    material: "Double-layer cotton",
    availableSizes: ["XS", "S", "M", "L", "XL", "CUSTOM"],
    isActive: true,
  },
  {
    id: "prod-cone-alt",
    slug: "soft-collar-wrap",
    name: "Soft Collar Wrap",
    description: "Cone alternative designed for comfort during rest.",
    basePriceHuf: 3200,
    heroImageUrl: "/products/soft-collar.jpg",
    material: "Medical mesh + neoprene",
    availableSizes: ["XS", "S", "M", "L", "CUSTOM"],
    isActive: true,
  },
  {
    id: "prod-leg-guard",
    slug: "post-op-leg-guard",
    name: "Post-op Leg Guard",
    description: "Targeted sleeve for limb procedures and wound isolation.",
    basePriceHuf: 4100,
    heroImageUrl: "/products/leg-guard.jpg",
    material: "Stretch knit with antimicrobial lining",
    availableSizes: ["S", "M", "L", "XL", "CUSTOM"],
    isActive: true,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1001",
    userId: "u-customer-1",
    totalHuf: 9600,
    status: "paid",
    stripeSessionId: "cs_test_mock_1",
    createdAt: "2026-03-20T12:40:00.000Z",
  },
  {
    id: "ord-1002",
    userId: "u-customer-2",
    totalHuf: 4100,
    status: "processing",
    stripeSessionId: "cs_test_mock_2",
    createdAt: "2026-03-22T14:10:00.000Z",
  },
];

export const MOCK_USERS: Profile[] = [
  {
    id: "u-admin-1",
    fullName: "Aria Patel",
    email: "admin@ouchcare.dev",
    role: "admin",
    clinicName: null,
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "u-vet-1",
    fullName: "Dr. Marco Silva",
    email: "vet@ouchcare.dev",
    role: "vet",
    clinicName: "City Paws Clinic",
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "u-customer-1",
    fullName: "Nina Hall",
    email: "nina@example.com",
    role: "customer",
    clinicName: null,
    createdAt: "2026-03-10T08:00:00.000Z",
  },
];

export const VET_FAQ = [
  {
    q: "How long should my pet wear post-op clothing?",
    a: "Follow your vet's timeline first. Most soft tissue surgeries need 7-14 days of protection.",
  },
  {
    q: "Can I wash recovery garments daily?",
    a: "Yes. Rotate at least two garments and wash with gentle, unscented detergent.",
  },
  {
    q: "What signs indicate poor fit?",
    a: 'Check for <span class="text-white">rolling seams, skin redness, excessive slipping, or restricted motion</span>.',
  },
];
