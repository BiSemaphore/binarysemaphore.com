// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Underline, Highlight, Strike, Bold } from "@/components/annotate";
import {
  StaticBold,
  StaticBox,
  StaticHighlight,
  StaticUnderline,
} from "@/components/annotate/static";
import { STROKES } from "@/components/annotate/shapes";
import { previewComponents } from "@/components/admin/preview-components";

describe("annotation props", () => {
  it("renders the same markup as before when given no props", () => {
    const html = renderToStaticMarkup(<Underline>x</Underline>);
    expect(html).toContain("text-blue/80");
    expect(html).toContain('stroke-width="2.5"');
    expect(html).not.toContain("color:");
  });

  it("takes a brand token as a CSS variable", () => {
    const html = renderToStaticMarkup(<Underline color="lime">x</Underline>);
    expect(html).toContain("color:var(--lime)");
  });

  it("passes an arbitrary CSS colour straight through", () => {
    const html = renderToStaticMarkup(<Strike color="#0a7">x</Strike>);
    expect(html).toContain("color:#0a7");
  });

  it("changes the stroke width with weight", () => {
    expect(renderToStaticMarkup(<Underline weight="thin">x</Underline>)).toContain('stroke-width="1.5"');
    expect(renderToStaticMarkup(<Underline weight="bold">x</Underline>)).toContain('stroke-width="4"');
  });

  it("scales the duration with speed and adds the delay", () => {
    const quick = renderToStaticMarkup(<Underline speed="quick" delay={200}>x</Underline>);
    expect(quick).toContain("690ms");
    expect(quick).toContain("200ms");
  });

  it("mixes a highlight colour with transparency, never flat", () => {
    const html = renderToStaticMarkup(<Highlight color="blue">x</Highlight>);
    expect(html).toContain("color-mix");
    expect(html).toContain("40%");
  });

  it("lets a highlight cover the line box instead of the words", () => {
    expect(renderToStaticMarkup(<Highlight height="line">x</Highlight>)).toContain("inset-y-0");
  });
});

describe("the static marks the admin preview uses", () => {
  // The point of splitting shapes out of the animation: the preview renders
  // the real geometry, not an approximation of it. Before this, the preview
  // drew `underline decoration-2` where the page draws a hand-drawn path.
  it("renders the same path data as the animated mark", () => {
    const html = renderToStaticMarkup(<StaticUnderline>x</StaticUnderline>);
    expect(html).toContain(STROKES.underline.d);
    expect(renderToStaticMarkup(<Underline>x</Underline>)).toContain(
      STROKES.underline.d,
    );
  });

  it("keeps each mark's own default colour", () => {
    expect(renderToStaticMarkup(<StaticBox>x</StaticBox>)).toContain(
      STROKES.box.color,
    );
  });

  it("is already drawn, since there is nothing to scroll into", () => {
    const html = renderToStaticMarkup(<StaticUnderline>x</StaticUnderline>);
    expect(html).toContain("stroke-dashoffset:0");
  });

  it("takes the same props as the animated one", () => {
    const html = renderToStaticMarkup(
      <StaticHighlight color="lime" opacity={0.6}>
        x
      </StaticHighlight>,
    );
    expect(html).toContain("var(--lime)");
    expect(html).toContain("60%");
  });

  it("is what the preview map actually wires up", () => {
    expect(previewComponents.Underline).toBe(StaticUnderline);
    expect(previewComponents.Highlight).toBe(StaticHighlight);
  });
});

describe("Bold", () => {
  // The one mark that colours the words rather than drawing around them, so it
  // is the one that must never make them unreadable.
  it("has a colour by default, since emphasis with none is just bold text", () => {
    const html = renderToStaticMarkup(<Bold>x</Bold>);
    expect(html).toContain("var(--accent)");
  });

  it("keeps the inherited colour as the second gradient stop", () => {
    // This is what makes it legible before, during and after the sweep, and in
    // any browser that never runs it.
    expect(renderToStaticMarkup(<Bold>x</Bold>)).toContain("currentColor");
  });

  it("takes a weight, unlike the stroke marks' pen pressure", () => {
    expect(renderToStaticMarkup(<Bold weight="black">x</Bold>)).toContain(
      "font-weight:900",
    );
  });

  it("starts undrawn and the static one starts drawn", () => {
    expect(renderToStaticMarkup(<Bold>x</Bold>)).toContain("right center");
    expect(renderToStaticMarkup(<StaticBold>x</StaticBold>)).toContain(
      "left center",
    );
  });
});
