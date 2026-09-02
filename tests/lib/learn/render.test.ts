import { describe, it, expect } from "vitest";
import { applyMarks, renderMarkdown } from "@/lib/learn/render";

describe("applyMarks", () => {
  it("renders each of the four highlighters", () => {
    expect(applyMarks("==carry this away==")).toContain("nb-mark-peach");
    expect(applyMarks("!!this bites!!")).toContain("nb-mark-rose");
    expect(applyMarks("++do this++")).toContain("nb-mark-mint");
    expect(applyMarks("%%a definition%%")).toContain("nb-mark-pink");
    expect(applyMarks("((circled))")).toContain("nb-circle");
  });

  it("keeps the marked words", () => {
    expect(applyMarks("==keep me==")).toContain(">keep me<");
  });

  // The books say marks do not work inside a fenced block, and code is full of
  // ==, !! and ++. Rewriting those would corrupt the sample.
  it("leaves fenced code alone", () => {
    const md = "```js\nif (a == b) x++;\n```";
    expect(applyMarks(md)).toBe(md);
  });

  it("leaves inline code alone", () => {
    expect(applyMarks("use `a == b` here")).toBe("use `a == b` here");
  });

  it("still marks prose either side of a code fence", () => {
    const out = applyMarks("==before==\n\n```\na == b\n```\n\n==after==");
    expect(out).toContain("nb-mark-peach");
    expect(out).toContain("a == b");
    expect(out.match(/nb-mark-peach/g)).toHaveLength(2);
  });

  it("does not span a line break", () => {
    expect(applyMarks("==open\nclose==")).not.toContain("nb-mark");
  });
});

describe("renderMarkdown", () => {
  it("renders headings, lists and emphasis", async () => {
    const html = await renderMarkdown("### Title\n\n- one\n- two\n\n**bold**");
    expect(html).toContain("<h3>Title</h3>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders gfm tables, which the books use for their block legends", async () => {
    const html = await renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("carries the marks through into the html", async () => {
    const html = await renderMarkdown("A ==key idea== here.");
    expect(html).toContain('<span class="nb-mark nb-mark-peach">key idea</span>');
  });

  it("keeps code fences as code", async () => {
    const html = await renderMarkdown("```sql\nselect 1;\n```");
    expect(html).toContain("<code");
    expect(html).toContain("select 1;");
  });
});
