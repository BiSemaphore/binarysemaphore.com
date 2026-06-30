"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  PAGE_MARGIN_X,
  PX_PER_MM,
  pageDims,
  pageSizeCss,
  scaleZoom,
  type PageSize,
  type ResumeContent,
  type TemplateId,
  type TextAlign,
} from "@/lib/resume/schema";
import { renderTemplate, getColumnLayout } from "@/components/resume/templates";
import { computeStarts, sameNumbers } from "@/lib/resume/paginate";

/**
 * Real-size, pre-paginated render of a resume for the PDF export. Headless
 * Chromium loads /print/[id] (which renders this) and turns each A4/Letter sheet
 * into one PDF page. It reuses the exact same pagination math as the on-screen
 * preview (computeStarts / getColumnLayout), so the PDF breaks pages in the same
 * places the editor shows — no transform scaling, real millimetre sheets with a
 * `break-after: page` between them.
 *
 * Pagination is measured client-side after fonts load, then `data-print-ready`
 * is set on <html> so the PDF route waits for layout to settle before printing.
 */

type Props = {
  templateId: TemplateId;
  content: ResumeContent;
  pageSize: PageSize;
  scalePct: number;
  padTop: number;
  padBottom: number;
  align: TextAlign;
};

/** Flag the document as laid out so Puppeteer can capture a stable render. */
function markPrintReady() {
  if (typeof document !== "undefined") {
    document.fonts?.ready.then(() => {
      document.documentElement.dataset.printReady = "1";
    });
  }
}

export function PrintDocument(props: Props) {
  const cols = getColumnLayout(props.templateId, props.content);
  return (
    <>
      <style>{`
        @page { size: ${pageSizeCss(props.pageSize)}; margin: 0; }
        html, body { background: #fff; margin: 0; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>
      {cols ? <PrintColumns {...props} parts={cols} /> : <PrintFlow {...props} />}
    </>
  );
}

function geometry(pageSize: PageSize, padTop: number, padBottom: number) {
  const dims = pageDims(pageSize);
  return {
    dims,
    contentWmm: dims.wMm - PAGE_MARGIN_X * 2,
    contentAreaPx: Math.max(1, (dims.hMm - padTop - padBottom) * PX_PER_MM),
  };
}

/** One true-size sheet; Chromium maps each to a PDF page via break-after. */
function Sheet({
  dims,
  padTop,
  padBottom,
  last,
  children,
}: {
  dims: { wMm: number; hMm: number };
  padTop: number;
  padBottom: number;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: `${dims.wMm}mm`,
        height: `${dims.hMm}mm`,
        paddingTop: `${padTop}mm`,
        paddingBottom: `${padBottom}mm`,
        paddingLeft: `${PAGE_MARGIN_X}mm`,
        paddingRight: `${PAGE_MARGIN_X}mm`,
        overflow: "hidden",
        background: "#fff",
        breakAfter: last ? undefined : "page",
      }}
    >
      {children}
    </div>
  );
}

function PrintFlow({
  templateId,
  content,
  pageSize,
  scalePct,
  padTop,
  padBottom,
  align,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentPx, setContentPx] = useState(0);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const { dims, contentAreaPx } = geometry(pageSize, padTop, padBottom);
  const zoom = scaleZoom(scalePct);
  const density = {
    zoom,
    textAlign: align,
  } as React.CSSProperties;

  useLayoutEffect(() => {
    const run = () => {
      const el = measureRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      setContentPx(h);
      const next = computeStarts(el, h, () => contentAreaPx);
      setPageStarts((prev) => (sameNumbers(prev, next) ? prev : next));
      markPrintReady();
    };
    const ro = new ResizeObserver(run);
    if (measureRef.current) ro.observe(measureRef.current);
    run();
    document.fonts?.ready.then(run);
    return () => ro.disconnect();
  }, [contentAreaPx, scalePct, padTop, padBottom, align]);

  return (
    <div>
      {pageStarts.map((startY, page) => {
        const endY = pageStarts[page + 1] ?? Math.max(contentPx, startY + 1);
        const sliceH = Math.min(contentAreaPx, endY - startY);
        return (
          <Sheet
            key={page}
            dims={dims}
            padTop={padTop}
            padBottom={padBottom}
            last={page === pageStarts.length - 1}
          >
            <div style={{ overflow: "hidden", height: sliceH }}>
              <div
                ref={page === 0 ? measureRef : undefined}
                style={{ ...density, transform: `translateY(${-startY / zoom}px)` }}
              >
                {renderTemplate(templateId, content)}
              </div>
            </div>
          </Sheet>
        );
      })}
    </div>
  );
}

function PrintColumns({
  pageSize,
  scalePct,
  padTop,
  padBottom,
  align,
  parts,
}: Props & { parts: NonNullable<ReturnType<typeof getColumnLayout>> }) {
  const topRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({
    topH: 0,
    footerH: 0,
    leftH: 0,
    rightH: 0,
    leftStarts: [0] as number[],
    rightStarts: [0] as number[],
  });

  const { dims, contentWmm, contentAreaPx } = geometry(pageSize, padTop, padBottom);
  const zoom = scaleZoom(scalePct);
  const density = {
    zoom,
    textAlign: align,
  } as React.CSSProperties;
  const colsStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `${parts.leftWidth} 1fr`,
    columnGap: parts.gap,
  };

  useLayoutEffect(() => {
    const run = () => {
      const left = leftRef.current;
      const right = rightRef.current;
      if (!left || !right) return;
      const topH = topRef.current?.getBoundingClientRect().height ?? 0;
      const footerH = footerRef.current?.getBoundingClientRect().height ?? 0;
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
      markPrintReady();
    };
    const ro = new ResizeObserver(run);
    for (const r of [topRef, footerRef, leftRef, rightRef]) {
      if (r.current) ro.observe(r.current);
    }
    run();
    document.fonts?.ready.then(run);
    return () => ro.disconnect();
  }, [contentAreaPx, scalePct, padTop, padBottom, align]);

  const pageCount = Math.max(m.leftStarts.length, m.rightStarts.length);

  return (
    <div>
      {/* Hidden measurer at true column width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{ width: 0, height: 0, overflow: "hidden" }}
      >
        <div style={{ width: `${contentWmm}mm` }}>
          <div ref={topRef} style={density}>
            {parts.top}
          </div>
          <div style={colsStyle}>
            <aside ref={leftRef} className={parts.asideClassName} style={density}>
              {parts.left}
            </aside>
            <div ref={rightRef} style={density}>
              {parts.right}
            </div>
          </div>
          <div ref={footerRef} style={density}>
            {parts.footer}
          </div>
        </div>
      </div>

      {Array.from({ length: pageCount }).map((_, page) => {
        const lStart = m.leftStarts[page] ?? m.leftH;
        const lEnd = m.leftStarts[page + 1] ?? m.leftH;
        const lSlice = Math.max(0, lEnd - lStart);
        const rStart = m.rightStarts[page] ?? m.rightH;
        const rEnd = m.rightStarts[page + 1] ?? m.rightH;
        const rSlice = Math.max(0, rEnd - rStart);
        const last = page === pageCount - 1;
        return (
          <Sheet
            key={page}
            dims={dims}
            padTop={padTop}
            padBottom={padBottom}
            last={last}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: contentAreaPx,
              }}
            >
              {page === 0 ? <div style={density}>{parts.top}</div> : null}
              <div style={{ ...colsStyle, flex: "1 1 auto", minHeight: 0 }}>
                <div className={parts.railClassName}>
                  <div style={{ overflow: "hidden", height: lSlice }}>
                    <aside
                      className={parts.asideClassName}
                      style={{ ...density, transform: `translateY(${-lStart / zoom}px)` }}
                    >
                      {parts.left}
                    </aside>
                  </div>
                </div>
                <div style={{ overflow: "hidden", height: rSlice }}>
                  <div
                    style={{ ...density, transform: `translateY(${-rStart / zoom}px)` }}
                  >
                    {parts.right}
                  </div>
                </div>
              </div>
              {last ? <div style={density}>{parts.footer}</div> : null}
            </div>
          </Sheet>
        );
      })}
    </div>
  );
}
