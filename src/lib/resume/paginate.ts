/**
 * Shared pagination math for the on-screen preview (ResumePaper) and the PDF
 * print page (PrintDocument), so both break pages in exactly the same places
 * (WYSIWYG). Pure DOM measurement, no React. Slice boundaries snap to "safe"
 * lines where no content block straddles the cut, so a bullet, entry, or line
 * is never bisected.
 */

/** Overflow under this many px does not spawn another page (rounding slop). */
export const PAGE_SLOP_PX = 8;
/** Vertical gap drawn between stacked preview sheets (CSS px, before scaling). */
export const PAGE_GAP_PX = 28;

/** A block's vertical extent within the measured content, in px. `heading` marks
 * a section label or entry title that should not be left alone at a page bottom. */
type Block = { top: number; bottom: number; heading: boolean };

const BLOCK_DISPLAY = /(block|flex|grid|table|list-item|flow-root)/;

/** True for blocks we should keep with the content that follows them: heading
 * tags (h1-h6) and any element explicitly marked data-kwn ("keep with next"). */
function isHeadingLike(el: HTMLElement): boolean {
  return /^H[1-6]$/.test(el.tagName) || el.hasAttribute("data-kwn");
}

/** Collect "leaf" blocks (block-level elements with no block-level child); their
 * bottom edges are the lines we may cut along. */
export function collectBlocks(root: HTMLElement): Block[] {
  const rootTop = root.getBoundingClientRect().top;
  const blocks: Block[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (!BLOCK_DISPLAY.test(getComputedStyle(el).display)) continue;
    let hasBlockChild = false;
    let childHeading = false;
    for (const child of Array.from(el.children)) {
      if (BLOCK_DISPLAY.test(getComputedStyle(child as HTMLElement).display)) {
        hasBlockChild = true;
        break;
      }
      // A heading often wraps the title plus an inline date/link; treat the row
      // as a heading if it or an inline child is heading-like.
      if (isHeadingLike(child as HTMLElement)) childHeading = true;
    }
    if (hasBlockChild) continue;
    const r = el.getBoundingClientRect();
    blocks.push({
      top: r.top - rootTop,
      bottom: r.bottom - rootTop,
      heading: isHeadingLike(el) || childHeading,
    });
  }
  return blocks;
}

/**
 * Compute the start offset (px) of each page so cuts land between content blocks,
 * never inside one. `areaFn(page)` gives the printable height available on each
 * page (varies when a header/footer eats into a page). First offset is always 0.
 */
export function computeStarts(
  root: HTMLElement,
  totalPx: number,
  areaFn: (page: number) => number,
): number[] {
  if (totalPx <= areaFn(0) + PAGE_SLOP_PX) return [0];
  const blocks = collectBlocks(root);
  const EPS = 1;
  const straddles = (y: number) =>
    blocks.some((b) => b.top < y - EPS && b.bottom > y + EPS);
  // True when cutting at y would leave a heading as the last thing on the page
  // (an orphaned section label / entry title). We avoid those cuts so a heading
  // travels to the next page with the content it introduces.
  const endsOnHeading = (y: number) => {
    let lastBottom = -Infinity;
    let lastIsHeading = false;
    for (const b of blocks) {
      if (b.bottom <= y + EPS && b.bottom > lastBottom) {
        lastBottom = b.bottom;
        lastIsHeading = b.heading;
      }
    }
    return lastIsHeading;
  };
  // True when the next content after y is a heading, i.e. the next page would
  // start at a section/entry boundary. Preferring these keeps a whole entry
  // (its title + body) on one page rather than splitting it.
  const byTop = [...blocks].sort((a, b) => a.top - b.top);
  const nextIsHeading = (y: number) => {
    for (const b of byTop) if (b.top >= y - EPS) return b.heading;
    return true; // nothing follows: a clean end.
  };
  const candidates = Array.from(
    new Set(blocks.map((b) => Math.round(b.bottom))),
  ).sort((a, b) => a - b);

  const starts = [0];
  let start = 0;
  let page = 0;
  let guard = 0;
  while (start < totalPx - PAGE_SLOP_PX && guard++ < 64) {
    const limit = start + Math.max(50, areaFn(page));
    if (limit >= totalPx - PAGE_SLOP_PX) break;
    let entryBoundary = -1; // next page starts at a heading (entry kept whole)
    let safe = -1; // a clean cut that may fall inside an entry
    let headingEnd = -1; // cut that orphans a heading (last resort)
    for (const y of candidates) {
      if (y > limit) break;
      if (y <= start + 4 || straddles(y)) continue;
      if (endsOnHeading(y)) {
        headingEnd = y;
        continue;
      }
      safe = y;
      if (nextIsHeading(y)) entryBoundary = y;
    }
    // Keep an entry whole only when that wastes little space. If keeping it
    // whole would leave a large gap (the next entry is too big for the
    // remainder), fill the page instead by cutting at the deepest safe item
    // boundary (still never mid-line, never orphaning a heading). Else fall back
    // to the entry boundary, a heading cut, or a hard cut at the limit.
    const area = Math.max(50, areaFn(page));
    const keepGap = entryBoundary >= 0 ? limit - entryBoundary : Infinity;
    let pick: number;
    let clean = true;
    if (entryBoundary >= 0 && keepGap <= area * 0.18) pick = entryBoundary;
    else if (safe >= 0) pick = safe;
    else if (entryBoundary >= 0) pick = entryBoundary;
    else if (headingEnd >= 0) pick = headingEnd;
    else {
      pick = limit; // a block taller than a page: hard-cut (clips mid-block).
      clean = false;
    }
    // A clean cut sits exactly at a block's bottom edge, where the clip window
    // would shave the line's descenders. Snap it down to the next block's top so
    // the break falls in the whitespace gap, matching how the PDF breaks between
    // lines. (Never for a hard cut, which would skip the rest of a tall block.)
    if (clean) {
      let nextTop = Infinity;
      for (const b of blocks) if (b.top > pick + EPS && b.top < nextTop) nextTop = b.top;
      if (Number.isFinite(nextTop)) pick = nextTop;
    }
    starts.push(pick);
    start = pick;
    page += 1;
  }
  return starts;
}

export function sameNumbers(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
