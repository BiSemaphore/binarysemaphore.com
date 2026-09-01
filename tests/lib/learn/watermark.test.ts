import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { stampForReader } from "@/lib/learn/watermark";

/** A throwaway 3-page A4 document to stamp. */
async function samplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i += 1) {
    const page = doc.addPage([595, 842]);
    page.drawText(`page ${i}`, { x: 50, y: 700, size: 12, font });
  }
  return doc.save();
}

const NOW = new Date("2026-09-01T00:00:00Z");

describe("stampForReader", () => {
  it("keeps every page", async () => {
    const stamped = await stampForReader(await samplePdf(), "a@b.com", NOW);
    const doc = await PDFDocument.load(stamped);
    expect(doc.getPageCount()).toBe(3);
  });

  it("keeps the page size, so the print geometry is untouched", async () => {
    const stamped = await stampForReader(await samplePdf(), "a@b.com", NOW);
    const doc = await PDFDocument.load(stamped);
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      expect(Math.round(width)).toBe(595);
      expect(Math.round(height)).toBe(842);
    }
  });

  it("returns a valid pdf", async () => {
    const stamped = await stampForReader(await samplePdf(), "a@b.com", NOW);
    expect(new TextDecoder().decode(stamped.slice(0, 5))).toBe("%PDF-");
  });

  // The whole point of the stamp: two readers must not get the same bytes, or a
  // leaked copy traces back to nobody. (The text itself sits in a compressed
  // object stream, so this compares output rather than grepping for a string.)
  it("gives two readers different files", async () => {
    const source = await samplePdf();
    const a = await stampForReader(source, "alice@example.com", NOW);
    const b = await stampForReader(source, "mallory@example.com", NOW);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it("adds content rather than replacing it", async () => {
    const source = await samplePdf();
    const stamped = await stampForReader(source, "alice@example.com", NOW);
    expect(stamped.byteLength).toBeGreaterThan(source.byteLength);
  });

  // Helvetica can only encode WinAnsi. An identity carrying anything else must
  // still produce a stamp rather than throwing and losing it.
  it("survives an identity outside WinAnsi", async () => {
    const stamped = await stampForReader(
      await samplePdf(),
      "研究者@example.com",
      NOW,
    );
    const doc = await PDFDocument.load(stamped);
    expect(doc.getPageCount()).toBe(3);
  });
});
