"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  PAGE_MARGIN_X,
  PX_PER_MM,
  pageDims,
  scaleZoom,
  type PageSize,
  type ResumeContent,
  type TemplateId,
  type TextAlign,
} from "@/lib/resume/schema";
import { renderTemplate } from "@/components/resume/templates";

/**
 * A true-size resume page (A4/Letter) scaled with `transform: scale` to fit its
 * container, so what you see is a faithful miniature of the exported PDF.
 * Shared by the editor, the template gallery cards, and the preview page.
 *
 * Margins live on the paper (top/bottom tunable, left/right fixed) to match the
 * @page box used for the PDF. Density (`scalePct`) zooms the content only.
 *
 * Pagination (`showPageBreaks`): the content is rendered once and sliced across
 * N real page sheets, each a true page box showing only its vertical slice, with
 * a gap and label in the gutter between them. Slice boundaries snap to *safe*
 * lines (where no content block straddles the cut) so a bullet, entry, or line
 * is never bisected, the way the exported PDF breaks between lines rather than
 * through them.
 */

/** Overflow under this many px does not spawn another page (rounding slop). */
const PAGE_SLOP_PX = 8;
/** Vertical gap drawn between stacked page sheets (CSS px, before fit-scaling). */
const PAGE_GAP_PX = 28;

/** A block's vertical extent within the measured content, in px. */
type Block = { top: number; bottom: number };

const BLOCK_DISPLAY = /(block|flex|grid|table|list-item|flow-root)/;

/**
 * Compute the start offset (px) of each page so cuts land between content
 * blocks, never inside one. Returns one offset per page (first is always 0).
 */
function computePageStarts(
  root: HTMLElement,
  areaPx: number,
  totalPx: number,
): number[] {
  if (totalPx <= areaPx + PAGE_SLOP_PX) return [0];

  // Collect "leaf" blocks: block-level elements with no block-level child.
  // Their bottom edges are the lines we may cut along; a cut is only safe if no
  // leaf block spans across it.
  const rootTop = root.getBoundingClientRect().top;
  const blocks: Block[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    if (!BLOCK_DISPLAY.test(getComputedStyle(el).display)) continue;
    let hasBlockChild = false;
    for (const child of Array.from(el.children)) {
      if (BLOCK_DISPLAY.test(getComputedStyle(child).display)) {
        hasBlockChild = true;
        break;
      }
    }
    if (hasBlockChild) continue;
    const r = el.getBoundingClientRect();
    blocks.push({ top: r.top - rootTop, bottom: r.bottom - rootTop });
  }

  const EPS = 1;
  const straddles = (y: number) =>
    blocks.some((b) => b.top < y - EPS && b.bottom > y + EPS);
  const candidates = Array.from(
    new Set(blocks.map((b) => Math.round(b.bottom))),
  ).sort((a, b) => a - b);

  const starts = [0];
  let start = 0;
  let guard = 0;
  while (start < totalPx - PAGE_SLOP_PX && guard++ < 64) {
    const limit = start + areaPx;
    if (limit >= totalPx - PAGE_SLOP_PX) break;
    // Largest safe candidate within this page's printable area.
    let chosen = -1;
    for (const y of candidates) {
      if (y > limit) break;
      if (y > start + 4 && !straddles(y)) chosen = y;
    }
    // No safe line fits (a block taller than a page): hard-cut at the limit.
    if (chosen < 0) chosen = limit;
    starts.push(chosen);
    start = chosen;
  }
  return starts;
}

export function ResumePaper({
  templateId,
  content,
  pageSize = "a4",
  scalePct = 100,
  padTop = 15,
  padBottom = 15,
  showPageBreaks = false,
  frame = true,
  align = "left",
}: {
  templateId: TemplateId;
  content: ResumeContent;
  pageSize?: PageSize;
  scalePct?: number;
  padTop?: number;
  padBottom?: number;
  showPageBreaks?: boolean;
  /** Paper chrome (border + shadow). Off for thumbnails where the card frames it. */
  frame?: boolean;
  /** Body-text alignment; templates' explicit header alignment still wins. */
  align?: TextAlign;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [contentPx, setContentPx] = useState(0);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);

  const dims = pageDims(pageSize);
  const paperWpx = dims.wMm * PX_PER_MM;
  const paperHpx = dims.hMm * PX_PER_MM;
  // Printable height per page (the page box minus its vertical margins).
  const contentAreaPx = Math.max(1, (dims.hMm - padTop - padBottom) * PX_PER_MM);

  const densityStyle = {
    zoom: scaleZoom(scalePct),
    textAlign: align,
  } as React.CSSProperties;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const measure = measureRef.current;
    if (!stage) return;
    const run = () => {
      const avail = stage.clientWidth;
      setFit(paperWpx > 0 ? Math.min(1, avail / paperWpx) : 1);
      if (measure && showPageBreaks) {
        const h = measure.offsetHeight;
        setContentPx(h);
        const next = computePageStarts(measure, contentAreaPx, h);
        setPageStarts((prev) =>
          prev.length === next.length && prev.every((v, i) => v === next[i])
            ? prev
            : next,
        );
      }
    };
    const ro = new ResizeObserver(run);
    ro.observe(stage);
    if (measure) ro.observe(measure);
    run();
    return () => ro.disconnect();
  }, [paperWpx, contentAreaPx, scalePct, padTop, padBottom, pageSize, align, showPageBreaks]);

  // --- Single auto-height sheet (cards / thumbnails). Keeps the old behaviour
  // where the paper grows with the content and there is no pagination. ---
  if (!showPageBreaks) {
    return (
      <div ref={stageRef} className="w-full">
        <div className="relative mx-auto" style={{ width: paperWpx * fit }}>
          <div
            className={`origin-top-left overflow-hidden bg-white ${
              frame ? "resume-frame" : ""
            }`}
            style={{
              width: `${dims.wMm}mm`,
              paddingTop: `${padTop}mm`,
              paddingBottom: `${padBottom}mm`,
              paddingLeft: `${PAGE_MARGIN_X}mm`,
              paddingRight: `${PAGE_MARGIN_X}mm`,
              transform: `scale(${fit})`,
            }}
          >
            <div style={densityStyle}>{renderTemplate(templateId, content)}</div>
          </div>
        </div>
      </div>
    );
  }

  // --- Paginated: N true page sheets, each showing its slice of the content. ---
  const pageCount = pageStarts.length;
  const stackHpx = pageCount * paperHpx + (pageCount - 1) * PAGE_GAP_PX;

  return (
    <div ref={stageRef} className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: paperWpx * fit, height: stackHpx * fit }}
      >
        <div
          className="origin-top-left"
          style={{ width: paperWpx, transform: `scale(${fit})` }}
        >
          {pageStarts.map((startY, page) => {
            const endY = pageStarts[page + 1] ?? Math.max(contentPx, startY + 1);
            const sliceH = Math.min(contentAreaPx, endY - startY);
            return (
              <div key={page} style={{ marginTop: page === 0 ? 0 : PAGE_GAP_PX }}>
                {page > 0 ? (
                  <div className="resume-page-label" aria-hidden>
                    Page {page + 1}
                  </div>
                ) : null}
                <div
                  className={`overflow-hidden bg-white ${frame ? "resume-frame" : ""}`}
                  style={{
                    width: `${dims.wMm}mm`,
                    height: `${dims.hMm}mm`,
                    paddingTop: `${padTop}mm`,
                    paddingBottom: `${padBottom}mm`,
                    paddingLeft: `${PAGE_MARGIN_X}mm`,
                    paddingRight: `${PAGE_MARGIN_X}mm`,
                  }}
                >
                  {/* This page's printable window: a fixed-height viewport that
                      clips the full content translated up to this page's slice.
                      Page 0 holds the ref we measure: cuts are computed from the
                      real, on-screen layout (same width/fonts), so they always
                      match what gets painted. */}
                  <div className="overflow-hidden" style={{ height: sliceH }}>
                    <div
                      ref={page === 0 ? measureRef : undefined}
                      style={{
                        ...densityStyle,
                        transform: `translateY(${-startY}px)`,
                      }}
                    >
                      {renderTemplate(templateId, content)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
