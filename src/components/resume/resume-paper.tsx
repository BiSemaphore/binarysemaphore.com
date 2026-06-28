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
} from "@/lib/resume/schema";
import { renderTemplate } from "@/components/resume/templates";

/**
 * A true-size resume page (A4/Letter) scaled with `transform: scale` to fit its
 * container, so what you see is a faithful miniature of the exported PDF.
 * Shared by the editor, the template gallery cards, and the preview page.
 *
 * Margins live on the paper (top/bottom tunable, left/right fixed) to match the
 * @page box used for the PDF. Density (`scalePct`) zooms the content only.
 */
export function ResumePaper({
  templateId,
  content,
  pageSize = "a4",
  scalePct = 100,
  padTop = 15,
  padBottom = 15,
  showPageBreaks = false,
  frame = true,
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
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [paperPx, setPaperPx] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const paper = paperRef.current;
    if (!stage || !paper) return;
    const measure = () => {
      const avail = stage.clientWidth;
      const w = paper.offsetWidth;
      const h = paper.offsetHeight;
      setPaperPx({ w, h });
      setFit(w > 0 ? Math.min(1, avail / w) : 1);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(paper);
    measure();
    return () => ro.disconnect();
  }, []);

  const dims = pageDims(pageSize);
  const densityStyle = { zoom: scaleZoom(scalePct) } as React.CSSProperties;

  const padTopPx = padTop * PX_PER_MM;
  const padBottomPx = padBottom * PX_PER_MM;
  const contentAreaPx = Math.max(1, (dims.hMm - padTop - padBottom) * PX_PER_MM);
  const contentOnlyPx = Math.max(0, paperPx.h - padTopPx - padBottomPx);
  const pageCount = showPageBreaks
    ? Math.max(1, Math.ceil(contentOnlyPx / contentAreaPx))
    : 1;

  return (
    <div ref={stageRef} className="w-full">
      <div
        className="relative mx-auto"
        style={{ width: paperPx.w * fit, height: paperPx.h * fit }}
      >
        <div
          ref={paperRef}
          className={`absolute left-0 top-0 overflow-hidden bg-white ${
            frame ? "resume-frame" : ""
          }`}
          style={{
            width: `${dims.wMm}mm`,
            paddingTop: `${padTop}mm`,
            paddingBottom: `${padBottom}mm`,
            paddingLeft: `${PAGE_MARGIN_X}mm`,
            paddingRight: `${PAGE_MARGIN_X}mm`,
            transform: `scale(${fit})`,
            transformOrigin: "top left",
          }}
        >
          <div style={densityStyle}>{renderTemplate(templateId, content)}</div>
          {Array.from({ length: pageCount - 1 }).map((_, i) => (
            <div
              key={i}
              className="resume-pagebreak"
              style={{ top: padTopPx + (i + 1) * contentAreaPx }}
              aria-hidden
            >
              <span>Page {i + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
