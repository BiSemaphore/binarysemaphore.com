/**
 * Generate the notebook reading view from the books next door.
 *
 * The books are written and typeset in the `learnings` repo in a directive
 * syntax the PDF pipeline understands (see its AUTHORING.md). This turns each
 * book into MDX, one file per section, so a notebook section is rendered the
 * same way a thread is: compiled at build time and imported as a module.
 *
 *   node scripts/sync-notebooks.mjs [--check]
 *
 * One file per section, plus an index.json listing them in reading order with
 * each section's prose length.
 *
 * The gate is per book, not per section: the reader renders whole sections until
 * a share of the book is spent, then stops importing. A section past the cut is
 * never imported, so it is not in the page at all and there is nothing to hide
 * with CSS.
 *
 * `--check` exits non-zero if the output is out of date, without writing.
 */
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.resolve(HERE, "../src/content/notebooks");
const SRC =
  process.env.NOTEBOOKS_BOOKS_DIR ??
  path.resolve(HERE, "../../learnings/notebooks/books");

/** Notebook slug -> source file. Mirrors SOURCE_DIRS in upload-notebooks.mjs. */
const BOOKS = {
  "question-bank": "question-bank.md",
  "large-scale-ingestion": "large-scale-ingestion.md",
  "object-storage": "object-storage.md",
  postgres: "postgres.md",
  security: "security.md",
  scaling: "scaling.md",
  "real-time-backends": "real-time-backends.md",
  "rest-api-design": "rest-api-design.md",
  "design-principles": "design-principles.md",
};

/** Directive -> MDX component. The eight annotation blocks. */
const CALLOUTS = {
  ask: "Ask",
  signal: "Signal",
  trap: "Trap",
  do: "DoThis",
  key: "KeyIdea",
  recall: "Recall",
  quiz: "Quiz",
  redraw: "Redraw",
};

/** Directives that are instructions to the typesetter, not content. */
const CONSUMED = new Set(["toc", "glossary", "part"]);

/** The four highlighters plus the circle, as the books write them. */
/**
 * A mark may wrap across lines, because the books are written at about 80
 * columns and a marked phrase often straddles two. It may not cross a blank
 * line: that would be two paragraphs, and an unclosed mark should stay literal
 * rather than swallow the rest of the section.
 */
const inside = (ch) => `(?:[^${ch}\\n]|\\n(?!\\n))+`;

const MARKS = [
  [new RegExp(`==(${inside("=")})==`, "g"), "Peach"],
  [new RegExp(`!!(${inside("!")})!!`, "g"), "Rose"],
  [new RegExp(`\\+\\+(${inside("+")})\\+\\+`, "g"), "Mint"],
  [new RegExp(`%%(${inside("%")})%%`, "g"), "Pink"],
  [new RegExp(`\\(\\((${inside(")")})\\)\\)`, "g"), "Circle"],
];

/** Segments marks must not touch: fenced and inline code. */
const PROTECTED = /(```[\s\S]*?```|`[^`\n]+`)/g;

/**
 * Rewrite the highlighters as components.
 *
 * Code is masked out rather than split around, because a mark often wraps a
 * code span: `==\`LEFT JOIN\`==` is one mark containing one code span. Splitting
 * on code leaves the two `==` in different pieces and the mark never matches,
 * which silently dropped it.
 *
 * Masking keeps `==` and `++` *inside* code safe, since the mask hides them,
 * while letting a mark spanning code still close.
 */
function applyMarks(text) {
  const held = [];
  let masked = text.replace(PROTECTED, (code) => {
    held.push(code);
    return `\u0000${held.length - 1}\u0000`;
  });

  for (const [pattern, name] of MARKS) {
    masked = masked.replace(pattern, `<${name}>$1</${name}>`);
  }

  return masked.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

/** "12. Indexes: the catalogue" -> "12-indexes-the-catalogue". */
function sectionSlug(number, title) {
  return `${number} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Escape a string for a double-quoted MDX/YAML attribute. */
const quote = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * Split a book into sections, rewriting directives into components as we go.
 * Fenced code wins over everything: a ::: inside a fence is text.
 */
function parse(markdown) {
  const lines = markdown.split("\n");
  const parts = [];
  const sections = [];
  /** The book's own number, from its :::title block, for "see Notebook 02". */
  let number = "";
  let current = null;
  let buffer = [];

  const push = (text) => {
    if (current) buffer.push(text);
  };
  const close = () => {
    if (!current) return;
    // Marks are applied here, to the whole body, not line by line: a mark
    // regularly wraps a line, because the books are set at about 80 columns,
    // and per-line application could never close one.
    current.body = applyMarks(
      buffer.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    );
    sections.push(current);
    current = null;
    buffer = [];
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    const fence = line.match(/^```/);
    if (fence) {
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) j += 1;
      push(lines.slice(i, j + 1).join("\n"));
      i = j + 1;
      continue;
    }

    const open = line.match(/^:::([a-z]+)[ \t]*(.*)$/);
    if (open) {
      const [, name, args] = open;
      const body = [];
      let j = i + 1;
      for (; j < lines.length && lines[j].trim() !== ":::"; j += 1) {
        body.push(lines[j]);
      }
      const inner = body.join("\n").trim();

      if (name === "title") {
        // "System Design Notebook / 02" on the first line.
        number = (inner.split("\n")[0].split("/")[1] ?? "").trim();
      } else if (name === "part") {
        close();
        const [number, title] = args.split("|").map((x) => x.trim());
        parts.push({ number: number ?? "", title: title ?? "" });
      } else if (name in CALLOUTS) {
        const tag = CALLOUTS[name];
        const text = args ? `${args}\n\n${inner}` : inner;
        push(`\n<${tag}>\n\n${text.trim()}\n\n</${tag}>\n`);
      } else if (name === "term") {
        push(
          `\n<Term name=${quote(args)}>\n\n${inner}\n\n</Term>\n`,
        );
      } else if (name === "figure") {
        push(`\n<Figure>\n\n${inner}\n\n</Figure>\n`);
      } else if (!CONSUMED.has(name)) {
        push(inner);
      }
      i = j + 1;
      continue;
    }

    const heading = line.match(/^## +(?:([0-9]+|[A-Z])\.\s*)?(.+)$/);
    if (heading) {
      close();
      const number = heading[1] ?? "";
      const title = heading[2].trim();
      current = {
        number,
        title,
        slug: sectionSlug(number, title),
        part: parts.length - 1,
      };
      i += 1;
      continue;
    }

    push(line);
    i += 1;
  }

  close();
  return { number, parts, sections };
}

/**
 * Break a section body into blocks, so prose can be measured separately from
 * figures and annotation blocks.
 *
 * A fenced block and a component block are atomic: both contain blank lines
 * (ASCII figures especially), so splitting on blank lines alone cuts through the
 * middle of one.
 */
function blocks(body) {
  const lines = body.split("\n");
  const out = [];
  let para = [];

  const flushPara = () => {
    const text = para.join("\n").trim();
    if (text) out.push(text);
    para = [];
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushPara();
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) j += 1;
      out.push(lines.slice(i, j + 1).join("\n"));
      i = j + 1;
      continue;
    }

    // Only a tag alone on its line opens a block. An inline mark such as
    // <Pink>latency</Pink> can also start a line but closes mid-line.
    const open = line.trim().match(/^<([A-Z][A-Za-z]*)(?:\s[^>]*)?>$/);
    if (open) {
      flushPara();
      const close = `</${open[1]}>`;
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== close) j += 1;
      out.push(lines.slice(i, j + 1).join("\n"));
      i = j + 1;
      continue;
    }

    if (line.trim() === "") flushPara();
    else para.push(line);
    i += 1;
  }

  flushPara();
  return out;
}

const check = process.argv.includes("--check");
const written = new Map();

/**
 * Parse every book before writing any of them.
 *
 * The books cross-reference constantly ("as in section 26", "see Notebook 02"),
 * and those are dead text today. Resolving them needs the whole library: a
 * section number to a slug within the same book, and a notebook number to
 * another book. So: parse everything, then write.
 */
const parsed = new Map();
for (const [slug, file] of Object.entries(BOOKS)) {
  const from = path.join(SRC, file);
  if (!existsSync(from)) {
    console.error(`  ! missing ${from}`);
    process.exit(1);
  }
  parsed.set(slug, parse(await readFile(from, "utf8")));
}

/** Notebook number ("02") -> slug, for "see Notebook 02". */
const byNumber = new Map(
  [...parsed].map(([slug, book]) => [book.number, slug]),
);

/** Within one book, section number ("26") -> section slug. */
function sectionIndex(book) {
  return new Map(
    book.sections.filter((s) => s.number).map((s) => [s.number, s.slug]),
  );
}

/**
 * Turn "section 26" and "Notebook 02" into links.
 *
 * Only when the target exists: the books also cite lecture numbers ("Notebook
 * 15") that are not part of this library, and a link to nothing is worse than
 * plain text. Code is masked first, so a comment mentioning a section is left
 * alone.
 */
function linkReferences(body, sections, refs) {
  const held = [];
  let masked = body.replace(PROTECTED, (code) => {
    held.push(code);
    return `\u0000${held.length - 1}\u0000`;
  });

  masked = masked.replace(/\b(section)\s+(\d+)\b/gi, (whole, word, n) => {
    const target = sections.get(String(Number(n)));
    if (!target) return whole;
    refs.add(`s:${target}`);
    return `<Ref to="#${target}">${word} ${n}</Ref>`;
  });

  masked = masked.replace(/\bNotebook\s+(\d+)\b/g, (whole, n) => {
    const target = byNumber.get(n.padStart(2, "0"));
    if (!target) return whole;
    refs.add(`n:${target}`);
    return `<Ref to="/${target}">${whole}</Ref>`;
  });

  return masked.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

for (const [slug, book] of parsed) {
  const { parts, sections } = book;
  const numbers = sectionIndex(book);
  const index = [];

  for (const section of sections) {
    const part = section.part >= 0 ? parts[section.part] : null;
    const refs = new Set();
    const body = linkReferences(section.body, numbers, refs);

    const frontmatter = [
      "---",
      `number: ${quote(section.number)}`,
      `title: ${quote(section.title)}`,
      `part: ${quote(part?.number ?? "")}`,
      `partTitle: ${quote(part?.title ?? "")}`,
      "---",
      "",
    ].join("\n");

    written.set(path.join(slug, `${section.slug}.mdx`), frontmatter + body + "\n");

    index.push({
      slug: section.slug,
      number: section.number,
      title: section.title,
      part: part?.number ?? "",
      partTitle: part?.title ?? "",
      // Prose length, so the reader can find the gate without opening every
      // file. Figures and annotation blocks do not count: they are not reading.
      length: blocks(section.body).reduce(
        (n, b) => n + (b.startsWith("<") || b.startsWith("```") ? 0 : b.length),
        0,
      ),
      // What this section points at. "s:<slug>" within this book,
      // "n:<slug>" to another notebook.
      refs: [...refs].sort(),
    });
  }

  // Backlinks. A section is worth reaching from the ones that lean on it, and
  // outgoing references alone leave two thirds of the rail empty: adding these
  // takes the sections with something to show from 32% to about half.
  const incoming = new Map();
  for (const section of index) {
    for (const ref of section.refs) {
      if (!ref.startsWith("s:")) continue;
      const target = ref.slice(2);
      if (!incoming.has(target)) incoming.set(target, []);
      incoming.get(target).push(section.slug);
    }
  }
  for (const section of index) {
    section.backrefs = (incoming.get(section.slug) ?? []).sort();
  }

  written.set(path.join(slug, "index.json"), JSON.stringify(index, null, 2) + "\n");
}

// Compare against what is on disk.
let stale = 0;
for (const [rel, content] of written) {
  const file = path.join(DEST, rel);
  const current = existsSync(file) ? await readFile(file, "utf8") : null;
  if (current === content) continue;
  stale += 1;
  if (check) continue;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

// Remove anything left behind by a book that shrank or a section that was renamed.
const orphans = [];
if (existsSync(DEST)) {
  for (const dir of await readdir(DEST, { withFileTypes: true })) {
    if (!dir.isDirectory()) {
      orphans.push(dir.name);
      continue;
    }
    for (const name of await readdir(path.join(DEST, dir.name))) {
      if (!written.has(path.join(dir.name, name))) {
        orphans.push(path.join(dir.name, name));
      }
    }
  }
}
if (!check) {
  for (const rel of orphans) {
    await rm(path.join(DEST, rel), { recursive: true, force: true });
  }
}

if (check && (stale || orphans.length)) {
  console.error(`  ! ${stale} file(s) out of date, ${orphans.length} orphaned`);
  console.error("\nRun: node scripts/sync-notebooks.mjs");
  process.exit(1);
}

console.log(
  `${written.size} file(s) across ${Object.keys(BOOKS).length} notebooks` +
    (stale || orphans.length
      ? `: ${stale} written, ${orphans.length} removed.`
      : ": already in step."),
);
