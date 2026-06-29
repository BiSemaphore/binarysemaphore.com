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
 * Pagination (`showPageBreaks`): instead of drawing a divider on top of one
 * continuous sheet (which overlaps the text at the boundary and clips at the
 * rounded corners), we render the content once and slice it across N real page
 * sheets, each a true page box that shows only its vertical slice. Page breaks
 * become genuine gaps between sheets, with the label in the gutter, so nothing
 * ever overlaps content. This matches how the exported PDF actually paginates.
 */

/**
 * Overflow under this many pixels does not spawn another page. Absorbs
 * sub-pixel measurement, `zoom` rounding, and a trailing margin so a few stray
 * pixels never produce a near-empty trailing sheet.
 */
const PAGE_SLOP_PX = 8;

/** Vertical gap drawn between stacked page sheets (CSS px, before fit-scaling). */
const PAGE_GAP_PX = 28;

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
      if (measure) setContentPx(measure.offsetHeight);
    };
    const ro = new ResizeObserver(run);
    ro.observe(stage);
    if (measure) ro.observe(measure);
    run();
    return () => ro.disconnect();
  }, [paperWpx, scalePct, padTop, padBottom, pageSize, align]);

  // --- Single auto-height sheet (cards / thumbnails). Keeps the old behaviour
  // where the paper grows with the content and there is no pagination. ---
  if (!showPageBreaks) {
    return (
      <div ref={stageRef} className="w-full">
        <div
          className="relative mx-auto"
          style={{ width: paperWpx * fit }}
        >
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
  const pageCount = Math.max(
    1,
    Math.ceil((contentPx - PAGE_SLOP_PX) / contentAreaPx),
  );
  const stackHpx = pageCount * paperHpx + (pageCount - 1) * PAGE_GAP_PX;

  return (
    <div ref={stageRef} className="w-full">
      {/* Off-screen measurer: the content laid out once at true page width so we
          can compute how many pages it spans. A 0x0 clipped wrapper keeps it out
          of the layout (and off any scrollbar) while the inner div still reports
          its natural height via offsetHeight. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{ width: 0, height: 0, overflow: "hidden" }}
      >
        <div
          ref={measureRef}
          style={{
            ...densityStyle,
            width: `${dims.wMm}mm`,
            paddingLeft: `${PAGE_MARGIN_X}mm`,
            paddingRight: `${PAGE_MARGIN_X}mm`,
            boxSizing: "border-box",
          }}
        >
          {renderTemplate(templateId, content)}
        </div>
      </div>

      <div
        className="relative mx-auto"
        style={{ width: paperWpx * fit, height: stackHpx * fit }}
      >
        <div
          className="origin-top-left"
          style={{
            width: paperWpx,
            transform: `scale(${fit})`,
          }}
        >
          {Array.from({ length: pageCount }).map((_, page) => (
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
                {/* The printable window for this page: a fixed-height viewport
                    that clips the full content translated up to this page's slice. */}
                <div
                  className="overflow-hidden"
                  style={{ height: contentAreaPx }}
                >
                  <div
                    style={{
                      ...densityStyle,
                      transform: `translateY(${-page * contentAreaPx}px)`,
                    }}
                  >
                    {renderTemplate(templateId, content)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
