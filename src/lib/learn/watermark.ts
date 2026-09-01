/**
 * Per-reader PDF stamping.
 *
 * Every notebook already carries "BINARYSEMAPHORE.COM/LEARN" in its running
 * head, baked in at build time in the `learnings` repo. That is branding, and
 * it is the same on every copy.
 *
 * This is the other half: the copy handed to one reader says who it was for.
 * It does not stop anyone sharing the file, and it is not meant to. It makes a
 * shared copy traceable, which is the part that actually changes behaviour.
 *
 * Runs on the Node runtime (pdf-lib is pure JS, no native deps).
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** Point size of the stamp. Small enough to read as page furniture. */
const FONT_SIZE = 5;

/** Distance from the bottom edge, in points. The books' own footer sits at
 * about 9.6pt (3.4mm), so this clears it without touching. */
const BASELINE = 4;

/** Light grey. Present, but never competing with the page. */
const INK = rgb(0.62, 0.62, 0.62);

/**
 * Helvetica is a standard font, so it can only encode WinAnsi. A display name
 * or email carrying anything outside that (an accented or CJK character, an
 * emoji) makes drawText throw. Replace what it cannot draw rather than lose the
 * stamp: an identity that is partly transliterated still traces back.
 */
function toWinAnsi(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/** "1 September 2026", the way a colophon would date it. */
function stampDate(now: Date): string {
  return now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Return a copy of `pdf` with a one-line ownership stamp centred in the bottom
 * margin of every page.
 *
 * `identity` is whatever names the reader: their email, or their user id when
 * the provider gave us no email. It is written verbatim, so pass something the
 * reader would recognise as themselves.
 */
export async function stampForReader(
  pdf: ArrayBuffer | Uint8Array,
  identity: string,
  now: Date = new Date(),
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const line = toWinAnsi(
    `Prepared for ${identity} · Binary Semaphore · ${stampDate(now)}`,
  );

  for (const page of doc.getPages()) {
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(line, FONT_SIZE);

    page.drawText(line, {
      x: Math.max(8, (width - textWidth) / 2),
      y: BASELINE,
      size: FONT_SIZE,
      font,
      color: INK,
    });
  }

  // useObjectStreams keeps the output close to the input size; without it a
  // 100-page notebook grows noticeably for one line of text per page.
  return doc.save({ useObjectStreams: true });
}
