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
import {
  renderTemplate,
  getColumnLayout,
  type ColumnParts,
} from "@/components/resume/templates";

/**
 * A true-size resume page (A4/Letter) scaled with `transform: scale` to fit its
 * container, so what you see is a faithful miniature of the exported PDF.
 * Shared by the editor, the template gallery cards, and the preview page.
 *
 * Margins live on the paper (top/bottom tunable, left/right fixed) to match the
 * @page box used for the PDF. Density (`scalePct`) zooms the content only.
 *
 * Pagination (`showPageBreaks`): the content is rendered once and sliced across
 * N real page sheets, each a true page box showing only its vertical slice.
 * Slice boundaries snap to *safe* lines (where no content block straddles the
 * cut) so a bullet, entry, or line is never bisected. Two-column templates (see
 * getColumnLayout) paginate each column as an independent flow, so the sidebar
 * and main break at their own boundaries rather than on one shared cut.
 */

/** Overflow under this many px does not spawn another page (rounding slop). */
const PAGE_SLOP_PX = 8;
/** Vertical gap drawn between stacked page sheets (CSS px, before fit-scaling). */
const PAGE_GAP_PX = 28;

/** A block's vertical extent within the measured content, in px. */
type Block = { top: number; bottom: number };

const BLOCK_DISPLAY = /(block|flex|grid|table|list-item|flow-root)/;

/** Collect "leaf" blocks (block-level elements with no block-level child); their
 * bottom edges are the lines we may cut along. */
function collectBlocks(root: HTMLElement): Block[] {
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
  return blocks;
}

/**
 * Compute the start offset (px) of each page so cuts land between content blocks,
 * never inside one. `areaFn(page)` gives the printable height available on each
 * page (varies when a header/footer eats into a page). First offset is always 0.
 */
function computeStarts(
  root: HTMLElement,
  totalPx: number,
  areaFn: (page: number) => number,
): number[] {
  if (totalPx <= areaFn(0) + PAGE_SLOP_PX) return [0];
  const blocks = collectBlocks(root);
  const EPS = 1;
  const straddles = (y: number) =>
    blocks.some((b) => b.top < y - EPS && b.bottom > y + EPS);
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
    let chosen = -1;
    for (const y of candidates) {
      if (y > limit) break;
      if (y > start + 4 && !straddles(y)) chosen = y;
    }
    if (chosen < 0) chosen = limit; // a block taller than a page: hard-cut.
    starts.push(chosen);
    start = chosen;
    page += 1;
  }
  return starts;
}

function sameArray(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ResumePaper(props: {
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
  const {
    templateId,
    content,
    showPageBreaks = false,
  } = props;
  const columns =
    showPageBreaks ? getColumnLayout(templateId, content) : null;
  if (columns) return <ColumnSheets {...props} parts={columns} />;
  return <FlowPaper {...props} />;
}

/** Geometry shared by every paper variant, derived from the page size + margins. */
function useGeometry(pageSize: PageSize, padTop: number, padBottom: number) {
  const dims = pageDims(pageSize);
  return {
    dims,
    paperWpx: dims.wMm * PX_PER_MM,
    paperHpx: dims.hMm * PX_PER_MM,
    contentAreaPx: Math.max(1, (dims.hMm - padTop - padBottom) * PX_PER_MM),
  };
}

/** Single-flow paper: one column, optionally sliced into stacked page sheets. */
function FlowPaper({
  templateId,
  content,
  pageSize = "a4",
  scalePct = 100,
  padTop = 15,
  padBottom = 15,
  showPageBreaks = false,
  frame = true,
  align = "left",
}: Parameters<typeof ResumePaper>[0]) {
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [contentPx, setContentPx] = useState(0);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);

  const { dims, paperWpx, paperHpx, contentAreaPx } = useGeometry(
    pageSize,
    padTop,
    padBottom,
  );
  const densityStyle = {
    zoom: scaleZoom(scalePct),
    textAlign: align,
  } as React.CSSProperties;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const run = () => {
      setFit(paperWpx > 0 ? Math.min(1, stage.clientWidth / paperWpx) : 1);
      const measure = measureRef.current;
      if (measure && showPageBreaks) {
        const h = measure.offsetHeight;
        setContentPx(h);
        const next = computeStarts(measure, h, () => contentAreaPx);
        setPageStarts((prev) => (sameArray(prev, next) ? prev : next));
      }
    };
    const ro = new ResizeObserver(run);
    ro.observe(stage);
    if (measureRef.current) ro.observe(measureRef.current);
    run();
    return () => ro.disconnect();
  }, [paperWpx, contentAreaPx, scalePct, padTop, padBottom, showPageBreaks]);

  if (!showPageBreaks) {
    return (
      <div ref={stageRef} className="w-full">
        <div className="relative mx-auto" style={{ width: paperWpx * fit }}>
          <div
            className={`origin-top-left overflow-hidden bg-white ${frame ? "resume-frame" : ""}`}
            style={{
              width: `${dims.wMm}mm`,
              paddingTop: `${padTop}mm`,
              paddingBottom: `${padBottom}mm`,
              paddingLeft: `${PAGE_MARGIN_X}mm`,
              paddingRight: `${PAGE_MARGIN_X}mm`,
              transform: `scale(${fit})`,
            }}
          >
            <div ref={measureRef} style={densityStyle}>
              {renderTemplate(templateId, content)}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <PageSheet dims={dims} padTop={padTop} padBottom={padBottom} frame={frame}>
                  <div className="overflow-hidden" style={{ height: sliceH }}>
                    <div
                      ref={page === 0 ? measureRef : undefined}
                      style={{ ...densityStyle, transform: `translateY(${-startY}px)` }}
                    >
                      {renderTemplate(templateId, content)}
                    </div>
                  </div>
                </PageSheet>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Two independent column flows (sidebar + main), paginated separately so each
 * breaks at its own item boundaries. Header on page 1, footer on the last. */
function ColumnSheets({
  parts,
  pageSize = "a4",
  scalePct = 100,
  padTop = 15,
  padBottom = 15,
  frame = true,
  align = "left",
}: Parameters<typeof ResumePaper>[0] & { parts: ColumnParts }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const [fit, setFit] = useState(1);
  const [m, setM] = useState({
    topH: 0,
    footerH: 0,
    leftH: 0,
    rightH: 0,
    leftStarts: [0] as number[],
    rightStarts: [0] as number[],
  });

  const { dims, paperWpx, paperHpx, contentAreaPx } = useGeometry(
    pageSize,
    padTop,
    padBottom,
  );
  const contentWmm = dims.wMm - PAGE_MARGIN_X * 2;
  const densityStyle = {
    zoom: scaleZoom(scalePct),
    textAlign: align,
  } as React.CSSProperties;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const run = () => {
      setFit(paperWpx > 0 ? Math.min(1, stage.clientWidth / paperWpx) : 1);
      const top = topRef.current;
      const footer = footerRef.current;
      const left = leftRef.current;
      const right = rightRef.current;
      if (!left || !right) return;
      const topH = top?.offsetHeight ?? 0;
      const footerH = footer?.offsetHeight ?? 0;
      const leftH = left.offsetHeight;
      const rightH = right.offsetHeight;
      const areaFn = (page: number) =>
        contentAreaPx - footerH - (page === 0 ? topH : 0);
      const leftStarts = computeStarts(left, leftH, areaFn);
      const rightStarts = computeStarts(right, rightH, areaFn);
      setM((prev) =>
        prev.topH === topH &&
        prev.footerH === footerH &&
        prev.leftH === leftH &&
        prev.rightH === rightH &&
        sameArray(prev.leftStarts, leftStarts) &&
        sameArray(prev.rightStarts, rightStarts)
          ? prev
          : { topH, footerH, leftH, rightH, leftStarts, rightStarts },
      );
    };
    const ro = new ResizeObserver(run);
    ro.observe(stage);
    for (const r of [topRef, footerRef, leftRef, rightRef]) {
      if (r.current) ro.observe(r.current);
    }
    run();
    return () => ro.disconnect();
  }, [paperWpx, contentAreaPx, scalePct, padTop, padBottom]);

  const pageCount = Math.max(m.leftStarts.length, m.rightStarts.length);
  const stackHpx = pageCount * paperHpx + (pageCount - 1) * PAGE_GAP_PX;
  // Printable height available to the columns on a page (mirrors the effect's
  // areaFn): the page area minus the footer reserve and page 1's header.
  const areaFor = (page: number) =>
    Math.max(50, contentAreaPx - m.footerH - (page === 0 ? m.topH : 0));

  const colsStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${parts.leftWidth} 1fr`,
    columnGap: parts.gap,
  };

  return (
    <div ref={stageRef} className="w-full">
      {/* Hidden measurer: lays out each part at true column width so we can size
          the header/footer and paginate each column independently. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{ width: 0, height: 0, overflow: "hidden" }}
      >
        <div style={{ width: `${contentWmm}mm` }}>
          <div ref={topRef} style={densityStyle}>
            {parts.top}
          </div>
          <div style={colsStyle}>
            <aside ref={leftRef} className={parts.asideClassName} style={densityStyle}>
              {parts.left}
            </aside>
            <div ref={rightRef} style={densityStyle}>
              {parts.right}
            </div>
          </div>
          <div ref={footerRef} style={densityStyle}>
            {parts.footer}
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto"
        style={{ width: paperWpx * fit, height: stackHpx * fit }}
      >
        <div
          className="origin-top-left"
          style={{ width: paperWpx, transform: `scale(${fit})` }}
        >
          {Array.from({ length: pageCount }).map((_, page) => {
            const lStart = m.leftStarts[page] ?? m.leftH;
            const lEnd = m.leftStarts[page + 1] ?? m.leftH;
            const lSlice = Math.max(0, lEnd - lStart);
            const rStart = m.rightStarts[page] ?? m.rightH;
            const rEnd = m.rightStarts[page + 1] ?? m.rightH;
            const rSlice = Math.max(0, rEnd - rStart);
            const last = page === pageCount - 1;
            return (
              <div key={page} style={{ marginTop: page === 0 ? 0 : PAGE_GAP_PX }}>
                {page > 0 ? (
                  <div className="resume-page-label" aria-hidden>
                    Page {page + 1}
                  </div>
                ) : null}
                <PageSheet dims={dims} padTop={padTop} padBottom={padBottom} frame={frame}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: contentAreaPx,
                    }}
                  >
                    {page === 0 ? <div style={densityStyle}>{parts.top}</div> : null}
                    {/* The columns area fills the page; the sidebar rail spans its
                        full height so it reads as a column even where empty. */}
                    <div style={{ ...colsStyle, height: areaFor(page) }}>
                      <div className={parts.railClassName}>
                        <div style={{ overflow: "hidden", height: lSlice }}>
                          <aside
                            className={parts.asideClassName}
                            style={{ ...densityStyle, transform: `translateY(${-lStart}px)` }}
                          >
                            {parts.left}
                          </aside>
                        </div>
                      </div>
                      <div style={{ overflow: "hidden", height: rSlice }}>
                        <div
                          style={{ ...densityStyle, transform: `translateY(${-rStart}px)` }}
                        >
                          {parts.right}
                        </div>
                      </div>
                    </div>
                    {last ? <div style={densityStyle}>{parts.footer}</div> : null}
                  </div>
                </PageSheet>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A true-size A4/Letter sheet with page margins as padding. */
function PageSheet({
  dims,
  padTop,
  padBottom,
  frame,
  children,
}: {
  dims: { wMm: number; hMm: number };
  padTop: number;
  padBottom: number;
  frame?: boolean;
  children: React.ReactNode;
}) {
  return (
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
      {children}
    </div>
  );
}
