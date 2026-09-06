import { describe, it, expect } from "vitest";
import { defineSchema, createSchema, enhanceSchema } from "./types";

describe("wizard schemas", () => {
  it("define step requires a creator", () => {
    expect(
      defineSchema.safeParse({ privacy: "PUBLIC", objectType: "PHOTOGRAPH" })
        .success,
    ).toBe(false);
    expect(
      defineSchema.safeParse({
        creatorName: "A. Sharma",
        privacy: "PUBLIC",
        objectType: "PHOTOGRAPH",
      }).success,
    ).toBe(true);
  });

  it("create step requires a title and a pinned image", () => {
    const missing = createSchema.safeParse({ title: "Untitled" });
    expect(missing.success).toBe(false);
    const ok = createSchema.safeParse({ title: "Untitled", imageCid: "bafk1" });
    expect(ok.success).toBe(true);
  });

  it("create step coerces year to a number", () => {
    const parsed = createSchema.parse({
      title: "T",
      imageCid: "bafk1",
      year: "1998",
    });
    expect(parsed.year).toBe(1998);
  });

  it("enhance step is fully optional", () => {
    expect(enhanceSchema.safeParse({}).success).toBe(true);
  });
});
