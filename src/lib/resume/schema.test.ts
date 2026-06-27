import { describe, it, expect } from "vitest";
import {
  DEFAULT_DENSITY,
  DEFAULT_TEMPLATE,
  DENSITIES,
  TEMPLATES,
  densityZoom,
  emptyResume,
  isDensity,
  isTemplateId,
  normalizeResume,
} from "./schema";

describe("emptyResume", () => {
  it("returns a complete, blank document", () => {
    const r = emptyResume();
    expect(r.basics.name).toBe("");
    expect(r.experience).toEqual([]);
    expect(r.education).toEqual([]);
    expect(r.skills).toEqual([]);
    expect(r.projects).toEqual([]);
    expect(r.links).toEqual([]);
  });
});

describe("normalizeResume", () => {
  it("fills missing fields from a partial object", () => {
    const r = normalizeResume({ basics: { name: "Ada" } });
    expect(r.basics.name).toBe("Ada");
    expect(r.basics.email).toBe("");
    expect(Array.isArray(r.experience)).toBe(true);
  });

  it("falls back to a blank document for junk input", () => {
    expect(normalizeResume(null)).toEqual(emptyResume());
    expect(normalizeResume("nope")).toEqual(emptyResume());
    expect(normalizeResume(42)).toEqual(emptyResume());
  });

  it("ignores non-array collection fields", () => {
    const r = normalizeResume({ skills: "not-an-array" });
    expect(r.skills).toEqual([]);
  });
});

describe("templates", () => {
  it("offers at most 5 templates with a valid default", () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);
    expect(TEMPLATES.length).toBeLessThanOrEqual(5);
    expect(isTemplateId(DEFAULT_TEMPLATE)).toBe(true);
  });

  it("recognizes only known template ids", () => {
    expect(isTemplateId("classic")).toBe(true);
    expect(isTemplateId("nope")).toBe(false);
  });
});

describe("density", () => {
  it("has a valid default with three options", () => {
    expect(DENSITIES.length).toBe(3);
    expect(isDensity(DEFAULT_DENSITY)).toBe(true);
  });

  it("recognizes only known densities", () => {
    expect(isDensity("tight")).toBe(true);
    expect(isDensity("nope")).toBe(false);
  });

  it("maps density to a zoom factor (regular = 1, unknown = 1)", () => {
    expect(densityZoom("regular")).toBe(1);
    expect(densityZoom("tight")).toBeLessThan(1);
    expect(densityZoom("roomy")).toBeGreaterThan(1);
    expect(densityZoom("nonsense")).toBe(1);
  });
});
