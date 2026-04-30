import { describe, expect, it } from "vitest";

import { pickSupportedSize, recommendSizeFromMeasurements } from "./sizing";

describe("sizing recommendations", () => {
  it("recommends a standard size for balanced measurements", () => {
    const result = recommendSizeFromMeasurements({
      neckCm: 30,
      chestCm: 48,
      backLengthCm: 40,
      legGirthCm: 15,
    });

    expect(result.recommendedSize).toBe("M");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("falls back to a custom fit for disproportionate measurements", () => {
    const result = recommendSizeFromMeasurements({
      neckCm: 24,
      chestCm: 62,
      backLengthCm: 34,
      legGirthCm: 16,
    });

    expect(result.recommendedSize).toBe("CUSTOM");
    expect(result.customFitAdjustmentHuf).toBeGreaterThan(0);
  });

  it("chooses the first supported size when the recommendation is unavailable", () => {
    const product = {
      availableSizes: ["S", "L"],
    } as const;

    expect(pickSupportedSize(product, "M")).toBe("S");
  });
});