// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Underline, Highlight, Strike } from "@/components/annotate";

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
