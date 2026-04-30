import { describe, expect, it } from "vitest";

import { measurementPayloadSchema, publicProfileUpsertSchema } from "./validation";

describe("API validation", () => {
  it("accepts numeric measurement strings and trims the pet name", () => {
    const result = measurementPayloadSchema.safeParse({
      petName: "  Luna  ",
      breed: "French Bulldog",
      neckCm: "24.5",
      chestCm: "51.2",
      backLengthCm: "37",
      legGirthCm: "16",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.petName).toBe("Luna");
      expect(result.data.chestCm).toBe(51.2);
    }
  });

  it("rejects admin role input from the public profile endpoint", () => {
    const result = publicProfileUpsertSchema.safeParse({
      fullName: "Dr. Taylor",
      role: "admin",
      clinicName: "Northside Vet",
    });

    expect(result.success).toBe(false);
  });
});