import type { PetMeasurements, Product, ProductSize } from "@/lib/types/domain";

const SIZE_ORDER: ProductSize[] = ["XS", "S", "M", "L", "XL", "CUSTOM"];

const SIZE_PROFILES: Record<Exclude<ProductSize, "CUSTOM">, { neckCm: number; chestCm: number; backLengthCm: number; legGirthCm: number }> = {
  XS: { neckCm: 18, chestCm: 30, backLengthCm: 24, legGirthCm: 9 },
  S: { neckCm: 24, chestCm: 38, backLengthCm: 32, legGirthCm: 12 },
  M: { neckCm: 30, chestCm: 48, backLengthCm: 40, legGirthCm: 15 },
  L: { neckCm: 37, chestCm: 60, backLengthCm: 50, legGirthCm: 18 },
  XL: { neckCm: 45, chestCm: 74, backLengthCm: 63, legGirthCm: 22 },
};

export type SizingRecommendation = {
  recommendedSize: ProductSize;
  confidence: number;
  explanation: string;
  customFitAdjustmentHuf: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeProfileDistance(measurement: PetMeasurements, profile: Exclude<ProductSize, "CUSTOM">) {
  const target = SIZE_PROFILES[profile];

  const neckDelta = Math.abs(measurement.neckCm - target.neckCm) / target.neckCm;
  const chestDelta = Math.abs(measurement.chestCm - target.chestCm) / target.chestCm;
  const backDelta = Math.abs(measurement.backLengthCm - target.backLengthCm) / target.backLengthCm;
  const legDelta = Math.abs(measurement.legGirthCm - target.legGirthCm) / target.legGirthCm;

  return neckDelta * 0.15 + chestDelta * 0.45 + backDelta * 0.3 + legDelta * 0.1;
}

function getRecommendationExplanation(measurement: PetMeasurements, size: Exclude<ProductSize, "CUSTOM">) {
  const target = SIZE_PROFILES[size];
  const chestDelta = measurement.chestCm - target.chestCm;
  const backDelta = measurement.backLengthCm - target.backLengthCm;

  if (Math.abs(chestDelta) <= 3 && Math.abs(backDelta) <= 3) {
    return `Chest and back length sit close to the ${size} fit band.`;
  }

  if (chestDelta > 0 && backDelta > 0) {
    return `Chest and back length both trend larger than the ${size} band.`;
  }

  if (chestDelta < 0 && backDelta < 0) {
    return `Measurements sit below the ${size} band, so a smaller cut is likely to be more comfortable.`;
  }

  if (Math.abs(chestDelta - backDelta) >= 8) {
    return `Chest and back length are not growing at the same rate, which usually signals a custom or hybrid fit.`;
  }

  return `The ${size} band is the closest match across chest, back, neck, and leg girth.`;
}

function getConfidence(distance: number) {
  return clamp(1 - distance * 2.2, 0.18, 0.98);
}

function computeCustomAdjustment(measurement: PetMeasurements, confidence: number) {
  const average = (measurement.neckCm + measurement.chestCm + measurement.backLengthCm + measurement.legGirthCm) / 4;
  const spread = Math.max(measurement.chestCm, measurement.backLengthCm) - Math.min(measurement.neckCm, measurement.legGirthCm);

  let adjustment = 650;

  if (average >= 55) {
    adjustment += 200;
  }

  if (spread >= 35) {
    adjustment += 250;
  }

  adjustment += Math.round((1 - confidence) * 300);

  return adjustment;
}

export function recommendSizeFromMeasurements(measurement: PetMeasurements | null): SizingRecommendation {
  if (!measurement) {
    return {
      recommendedSize: "M",
      confidence: 0.3,
      explanation: "No saved measurements yet, so M is the safest default starting point.",
      customFitAdjustmentHuf: 0,
    };
  }

  const rankedProfiles = SIZE_ORDER.filter((size): size is Exclude<ProductSize, "CUSTOM"> => size !== "CUSTOM")
    .map((size) => ({ size, distance: computeProfileDistance(measurement, size) }))
    .sort((left, right) => left.distance - right.distance);

  const best = rankedProfiles[0] ?? { size: "M" as const, distance: 1 };
  const runnerUp = rankedProfiles[1] ?? { distance: best.distance + 0.2 };

  const confidence = getConfidence(best.distance);
  const explanation = getRecommendationExplanation(measurement, best.size);
  const sizeGap = runnerUp.distance - best.distance;
  const disproportionateShape = Math.abs(measurement.chestCm - measurement.backLengthCm) >= 18;

  const recommendedSize: ProductSize = confidence < 0.48 || sizeGap < 0.05 || disproportionateShape ? "CUSTOM" : best.size;

  return {
    recommendedSize,
    confidence,
    explanation:
      recommendedSize === "CUSTOM"
        ? "The body shape looks uneven across key measurements, so a custom cut is safer than forcing a standard size."
        : explanation,
    customFitAdjustmentHuf: recommendedSize === "CUSTOM" ? computeCustomAdjustment(measurement, confidence) : 0,
  };
}

export function pickSupportedSize(product: Product, preferred: ProductSize) {
  if (product.availableSizes.includes(preferred)) {
    return preferred;
  }

  for (const size of SIZE_ORDER) {
    if (product.availableSizes.includes(size)) {
      return size;
    }
  }

  return "CUSTOM";
}

export function formatConfidenceLabel(confidence: number) {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.6) {
    return "moderate";
  }

  return "low";
}