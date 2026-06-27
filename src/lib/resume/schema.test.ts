import { describe, it, expect } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SCALE,
  DEFAULT_TEMPLATE,
  DENSITIES,
  PAGE_MARGIN_X,
  PAGE_SIZES,
  PX_PER_MM,
  TEMPLATES,
  clampPad,
  clampScale,
  densityForScale,
  emptyResume,
  isPageSize,
  isTemplateId,
  normalizeResume,
  pageDims,
  pageSizeCss,
  scaleZoom,
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

describe("tune: scale + density", () => {
  it("clamps scale to bounds and rounds", () => {
    expect(clampScale(100)).toBe(100);
    expect(clampScale(5)).toBe(60);
    expect(clampScale(999)).toBe(130);
    expect(clampScale(NaN)).toBe(DEFAULT_SCALE);
  });

  it("converts a scale percent to a zoom factor", () => {
    expect(scaleZoom(100)).toBe(1);
    expect(scaleZoom(90)).toBeCloseTo(0.9);
  });

  it("maps a scale back to its density preset (or null)", () => {
    expect(DENSITIES.length).toBe(3);
    expect(densityForScale(90)).toBe("tight");
    expect(densityForScale(100)).toBe("regular");
    expect(densityForScale(95)).toBeNull();
  });
});

describe("tune: page margins", () => {
  it("clamps pad to bounds and rounds", () => {
    expect(clampPad(12)).toBe(12);
    expect(clampPad(-5)).toBe(0);
    expect(clampPad(999)).toBe(40);
    expect(clampPad(8.6)).toBe(9);
  });
});

describe("page size", () => {
  it("defaults to A4 and offers Letter", () => {
    expect(DEFAULT_PAGE_SIZE).toBe("a4");
    expect(PAGE_SIZES.map((p) => p.id)).toContain("letter");
    expect(isPageSize(DEFAULT_PAGE_SIZE)).toBe(true);
  });

  it("recognizes only known page sizes", () => {
    expect(isPageSize("a4")).toBe(true);
    expect(isPageSize("nope")).toBe(false);
  });

  it("maps to a CSS @page size keyword (unknown -> A4)", () => {
    expect(pageSizeCss("a4")).toBe("A4");
    expect(pageSizeCss("letter")).toBe("letter");
    expect(pageSizeCss("nonsense")).toBe("A4");
  });
});

describe("page geometry", () => {
  it("gives mm dimensions per page size (unknown -> A4)", () => {
    expect(pageDims("a4")).toEqual({ wMm: 210, hMm: 297 });
    expect(pageDims("letter")).toEqual({ wMm: 215.9, hMm: 279.4 });
    expect(pageDims("nonsense")).toEqual({ wMm: 210, hMm: 297 });
  });

  it("exposes the px-per-mm constant and a fixed horizontal margin", () => {
    expect(PX_PER_MM).toBeCloseTo(3.7795, 3);
    expect(PAGE_MARGIN_X).toBe(16);
  });
});
