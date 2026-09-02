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
 * Two files per section:
 *
 *   src/content/notebooks/<slug>/<section>.mdx        the free preview
 *   src/content/notebooks/<slug>/<section>.rest.mdx   the rest, behind the gate
 *
 * Splitting here rather than at request time is what makes the gate honest: the
 * gated file is only imported for an entitled reader, so its content never
 * reaches the page otherwise. There is nothing to hide with CSS.
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
const CONSUMED = new Set(["title", "toc", "glossary", "part"]);

/** The four highlighters plus the circle, as the books write them. */
const MARKS = [
  [/==([^=\n]+)==/g, "Peach"],
  [/!!([^!\n]+)!!/g, "Rose"],
  [/\+\+([^+\n]+)\+\+/g, "Mint"],
  [/%%([^%\n]+)%%/g, "Pink"],
  [/\(\(([^)\n]+)\)\)/g, "Circle"],
];

/** Segments marks must not touch: fenced and inline code. */
const PROTECTED = /(```[\s\S]*?```|`[^`\n]+`)/g;

/** Rewrite the highlighters as components, leaving code alone. */
function applyMarks(text) {
  return text
    .split(PROTECTED)
    .map((chunk, i) => {
      if (i % 2 === 1) return chunk; // a captured code segment
      let out = chunk;
      for (const [pattern, name] of MARKS) {
        out = out.replace(pattern, `<${name}>$1</${name}>`);
      }
      return out;
    })
    .join("");
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
  let current = null;
  let buffer = [];

  const push = (text) => {
    if (current) buffer.push(text);
  };
  const close = () => {
    if (!current) return;
    current.body = buffer.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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

      if (name === "part") {
        close();
        const [number, title] = args.split("|").map((x) => x.trim());
        parts.push({ number: number ?? "", title: title ?? "" });
      } else if (name in CALLOUTS) {
        const tag = CALLOUTS[name];
        const text = args ? `${args}\n\n${inner}` : inner;
        push(`\n<${tag}>\n\n${applyMarks(text.trim())}\n\n</${tag}>\n`);
      } else if (name === "term") {
        push(
          `\n<Term name=${quote(args)}>\n\n${applyMarks(inner)}\n\n</Term>\n`,
        );
      } else if (name === "figure") {
        push(`\n<Figure>\n\n${applyMarks(inner)}\n\n</Figure>\n`);
      } else if (!CONSUMED.has(name)) {
        push(applyMarks(inner));
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

    push(applyMarks(line));
    i += 1;
  }

  close();
  return { parts, sections };
}

/**
 * Where to cut a section between free and gated.
 *
 * A share of the prose, not a fixed number of paragraphs: sections run from a
 * few hundred to several thousand characters, and a fixed count opens a short
 * one entirely.
 */
const FREE_SHARE = 0.35;

/**
 * Break a section body into blocks that can be split between.
 *
 * A fenced block and a component block are atomic: both contain blank lines
 * (ASCII figures especially), so splitting on blank lines alone cuts through the
 * middle of one and leaves an unterminated fence in the preview.
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

    // Only a tag alone on its own line opens a block. An inline mark such as
    // <Pink>latency</Pink> can also start a line, and its closing tag is
    // mid-line, so matching loosely here swallows the rest of the section.
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

function split(body) {
  const parts = blocks(body);

  // Sentence-splitting is only safe on plain prose: doing it to a fence or a
  // component flattens the newlines and destroys the block.
  const splittable =
    parts.length < 2 && !/^(```|<[A-Z])/m.test(body.trim());

  if (splittable) {
    const sentences = body.split(/(?<=\.)\s+/);
    if (sentences.length < 2) return { free: body, rest: "" };
    const keep = Math.max(1, Math.floor(sentences.length * FREE_SHARE));
    return {
      free: sentences.slice(0, keep).join(" ").trim(),
      rest: sentences.slice(keep).join(" ").trim(),
    };
  }

  // A single block that cannot be sentence-split stays whole and free.
  if (parts.length < 2) return { free: body, rest: "" };

  // Only prose counts towards the reading budget: a long ASCII figure is not
  // reading. But zero-weight blocks must not be free without limit, or a
  // section that is mostly figures and annotation blocks is given away whole.
  // So a second, looser cap on raw characters runs alongside it.
  const weight = (b) =>
    b.startsWith("<") || b.startsWith("```") ? 0 : b.length;

  const proseBudget = parts.reduce((n, b) => n + weight(b), 0) * FREE_SHARE;
  const charBudget = parts.reduce((n, b) => n + b.length, 0) * 0.5;

  let spent = 0;
  let chars = 0;
  let cut = 0;
  for (const [i, block] of parts.entries()) {
    if (
      cut > 0 &&
      (spent + weight(block) > proseBudget || chars + block.length > charBudget)
    ) {
      break;
    }
    spent += weight(block);
    chars += block.length;
    cut = i + 1;
  }
  if (cut === 0) cut = 1;
  if (cut >= parts.length) cut = parts.length - 1;

  let free = parts.slice(0, cut);
  let rest = parts.slice(cut);

  // When the opening block is itself most of the section, cutting after it
  // gives the section away. Split that block's sentences instead.
  const size = (list) => list.reduce((n, b) => n + weight(b), 0);
  if (free.length === 1 && weight(free[0]) > 0) {
    const total = size(free) + size(rest);
    if (total > 0 && size(free) / total > 0.6) {
      const sentences = free[0].split(/(?<=\.)\s+/);
      if (sentences.length > 1) {
        const keep = Math.max(1, Math.floor(sentences.length * FREE_SHARE));
        rest = [sentences.slice(keep).join(" ").trim(), ...rest];
        free = [sentences.slice(0, keep).join(" ").trim()];
      }
    }
  }

  return { free: free.join("\n\n"), rest: rest.join("\n\n") };
}

/** How much of what comes next to show, faded, under the gate. */
const TEASER_CHARS = 180;

function teaser(rest) {
  // Only a plain paragraph. A table, list, heading, fence or component block
  // all lose their meaning once flattened to a single line of text.
  const first = blocks(rest).find((b) => {
    const s = b.trim();
    return s && !/^(<|```|\||#|[-*>]\s|\d+\.\s)/.test(s);
  });
  if (!first) return "";
  // Rendered as plain text under the gate, so the component tags the marks were
  // rewritten into, and markdown emphasis, have to come back off.
  const text = first
    .trim()
    .replace(/<\/?[A-Z][A-Za-z]*(?:\s[^>]*)?>/g, "")
    .replace(/[`*_]/g, "")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= TEASER_CHARS) return text;
  const cut = text.slice(0, TEASER_CHARS);
  const space = cut.lastIndexOf(" ");
  return (space > 60 ? cut.slice(0, space) : cut).trim();
}

const check = process.argv.includes("--check");
const written = new Map();

for (const [slug, file] of Object.entries(BOOKS)) {
  const from = path.join(SRC, file);
  if (!existsSync(from)) {
    console.error(`  ! missing ${from}`);
    process.exit(1);
  }

  const { parts, sections } = parse(await readFile(from, "utf8"));
  const index = [];

  for (const section of sections) {
    const { free, rest } = split(section.body);
    const part = section.part >= 0 ? parts[section.part] : null;

    const frontmatter = [
      "---",
      `number: ${quote(section.number)}`,
      `title: ${quote(section.title)}`,
      `part: ${quote(part?.number ?? "")}`,
      `partTitle: ${quote(part?.title ?? "")}`,
      "---",
      "",
    ].join("\n");

    written.set(path.join(slug, `${section.slug}.mdx`), frontmatter + free + "\n");
    if (rest) {
      written.set(path.join(slug, `${section.slug}.rest.mdx`), rest + "\n");
    }

    index.push({
      slug: section.slug,
      number: section.number,
      title: section.title,
      part: part?.number ?? "",
      partTitle: part?.title ?? "",
      gated: Boolean(rest),
      teaser: teaser(rest),
    });
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
