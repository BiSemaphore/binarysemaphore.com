"use client";

import {
  DENSITIES,
  PAD_MAX,
  PAD_MIN,
  PAGE_SIZES,
  SCALE_MAX,
  SCALE_MIN,
  TEXT_ALIGNS,
  clampPad,
  clampScale,
  densityForScale,
  type PageSize,
  type TextAlign,
} from "@/lib/resume/schema";
import { Segmented, Slider } from "@/components/resume/editor-ui";

/** The "tune" popover: scale, density, page margins, page size, alignment. */
export function TunePanel({
  scalePct,
  setScalePct,
  padTop,
  setPadTop,
  padBottom,
  setPadBottom,
  pageSize,
  setPageSize,
  textAlign,
  setTextAlign,
  onReset,
  onClose,
}: {
  scalePct: number;
  setScalePct: (v: number) => void;
  padTop: number;
  setPadTop: (v: number) => void;
  padBottom: number;
  setPadBottom: (v: number) => void;
  pageSize: PageSize;
  setPageSize: (v: PageSize) => void;
  textAlign: TextAlign;
  setTextAlign: (v: TextAlign) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close tune"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div className="rx-panel absolute right-0 top-full z-40 mt-2 w-[248px] max-w-[calc(100vw-1.5rem)] p-3.5 font-mono text-xs">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[color:var(--rx-muted)]">{"// tune"}</span>
          <button
            type="button"
            onClick={onReset}
            className="text-[color:var(--rx-muted)] transition-colors hover:text-foreground"
          >
            reset
          </button>
        </div>
        <Slider
          label="scale"
          value={scalePct}
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={1}
          display={`${(scalePct / 100).toFixed(2)}x`}
          onChange={(v) => setScalePct(clampScale(v))}
        />
        <div className="mt-3">
          <Segmented
            green
            block
            label="density"
            options={DENSITIES}
            value={densityForScale(scalePct)}
            onChange={(d) => {
              const preset = DENSITIES.find((x) => x.id === d);
              if (preset) setScalePct(preset.scale);
            }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-3">
          <Slider
            label="pad top"
            value={padTop}
            min={PAD_MIN}
            max={PAD_MAX}
            step={1}
            display={`${padTop}mm`}
            onChange={(v) => setPadTop(clampPad(v))}
          />
          <Slider
            label="pad bottom"
            value={padBottom}
            min={PAD_MIN}
            max={PAD_MAX}
            step={1}
            display={`${padBottom}mm`}
            onChange={(v) => setPadBottom(clampPad(v))}
          />
        </div>
        <div className="mt-3">
          <Segmented
            green
            block
            label="page"
            options={PAGE_SIZES}
            value={pageSize}
            onChange={setPageSize}
          />
        </div>
        <div className="mt-3">
          <Segmented
            green
            block
            label="align"
            options={TEXT_ALIGNS}
            value={textAlign}
            onChange={setTextAlign}
          />
        </div>
      </div>
    </>
  );
}
