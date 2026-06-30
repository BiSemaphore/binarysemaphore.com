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
import { computeStarts, sameNumbers, PAGE_GAP_PX } from "@/lib/resume/paginate";

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
  const zoom = scaleZoom(scalePct);
  const densityStyle = {
    zoom,
    textAlign: align,
  } as React.CSSProperties;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const run = () => {
      setFit(paperWpx > 0 ? Math.min(1, stage.clientWidth / paperWpx) : 1);
      const measure = measureRef.current;
      if (measure && showPageBreaks) {
        // Use getBoundingClientRect (rendered px, after `zoom`) consistently
        // with collectBlocks, so the total height and the block offsets are in
        // the same coordinate space.
        const h = measure.getBoundingClientRect().height;
        setContentPx(h);
        const next = computeStarts(measure, h, () => contentAreaPx);
        setPageStarts((prev) => (sameNumbers(prev, next) ? prev : next));
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
                      style={{
                        ...densityStyle,
                        // translate is inside the zoomed box, so divide by zoom
                        // to move by startY rendered px.
                        transform: `translateY(${-startY / zoom}px)`,
                      }}
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
  const zoom = scaleZoom(scalePct);
  const densityStyle = {
    zoom,
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
      // getBoundingClientRect (rendered px, after `zoom`) to match collectBlocks.
      const topH = top?.getBoundingClientRect().height ?? 0;
      const footerH = footer?.getBoundingClientRect().height ?? 0;
      const leftH = left.getBoundingClientRect().height;
      const rightH = right.getBoundingClientRect().height;
      const areaFn = (page: number) =>
        contentAreaPx - footerH - (page === 0 ? topH : 0);
      const leftStarts = computeStarts(left, leftH, areaFn);
      const rightStarts = computeStarts(right, rightH, areaFn);
      setM((prev) =>
        prev.topH === topH &&
        prev.footerH === footerH &&
        prev.leftH === leftH &&
        prev.rightH === rightH &&
        sameNumbers(prev.leftStarts, leftStarts) &&
        sameNumbers(prev.rightStarts, rightStarts)
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
                    {/* The columns area fills the page (flex-1) so the divider
                        runs the full height down to the footer, not a floating
                        box. Each column shows only its own slice. */}
                    <div style={{ ...colsStyle, flex: "1 1 auto", minHeight: 0 }}>
                      <div className={parts.railClassName}>
                        <div style={{ overflow: "hidden", height: lSlice }}>
                          <aside
                            className={parts.asideClassName}
                            style={{ ...densityStyle, transform: `translateY(${-lStart / zoom}px)` }}
                          >
                            {parts.left}
                          </aside>
                        </div>
                      </div>
                      <div style={{ overflow: "hidden", height: rSlice }}>
                        <div
                          style={{ ...densityStyle, transform: `translateY(${-rStart / zoom}px)` }}
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
