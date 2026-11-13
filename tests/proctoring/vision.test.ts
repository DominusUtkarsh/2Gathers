import { describe, it, expect } from "vitest";
import { compareFaceSignatures } from "@/lib/proctoring/vision";

describe("Proctoring Vision Engine", () => {
  it("computes 1.0 similarity for identical face signatures", () => {
    // Normalized mock signature vector
    const vector = [0.2, 0.4, 0.5, 0.1, 0.6, 0.3];
    const norm = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
    const normalized = vector.map((v) => v / norm);

    const similarity = compareFaceSignatures(normalized, normalized);
    expect(similarity).toBeCloseTo(1.0, 4);
  });

  it("detects lower similarity for different face signatures (impersonation / substitution)", () => {
    const personA = [0.8, 0.1, 0.1, 0.9, 0.0, 0.1];
    const normA = Math.sqrt(personA.reduce((a, b) => a + b * b, 0));
    const normalizedA = personA.map((v) => v / normA);

    const personB = [0.1, 0.7, 0.8, 0.1, 0.9, 0.8];
    const normB = Math.sqrt(personB.reduce((a, b) => a + b * b, 0));
    const normalizedB = personB.map((v) => v / normB);

    const similarity = compareFaceSignatures(normalizedA, normalizedB);
    // Should be significantly lower than threshold 0.72
    expect(similarity).toBeLessThan(0.6);
  });

  it("handles null or mismatched vectors gracefully without crashing", () => {
    expect(compareFaceSignatures(null, [0.5])).toBe(0);
    expect(compareFaceSignatures([0.5], null)).toBe(0);
    expect(compareFaceSignatures([0.5], [0.5, 0.5])).toBe(0);
  });
});
