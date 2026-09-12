import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { ImageResponse } from "next/og";
import { getTeamMember, site, team } from "@/lib/site";
import { memberBuilds } from "@/lib/team";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Team member profile at Binary Semaphore";

// One image per team member, rendered at build like the page itself.
export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

// Light theme tokens from globals.css. The image has no CSS, so they are
// repeated here rather than read.
const ink = "#111111";
const muted = "#525252";
const subtle = "#8a8a8a";
const border = "#e6e6e6";
const background = "#f6f6f4";
const tray = "#ececea";
const accent = "#a80000";
const blue = "#2e6ff2";

// Every path below is a literal folder under the project root, so the bundler
// can trace exactly these files instead of the whole project.
const fontDir = join(process.cwd(), "assets", "og-fonts");

function dataUri(file: Buffer, type: string): string {
  return `data:${type};base64,${file.toString("base64")}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getTeamMember(slug);

  const [display, sans, sansSemi, markFile] = await Promise.all([
    readFile(join(fontDir, "plus-jakarta-sans-latin-700-normal.woff")),
    readFile(join(fontDir, "inter-tight-latin-400-normal.woff")),
    readFile(join(fontDir, "inter-tight-latin-600-normal.woff")),
    readFile(join(process.cwd(), "public", "brand", "mark.svg")),
  ]);
  const mark = dataUri(markFile, "image/svg+xml");
  // Avatars live in public/team (see TeamMember.avatar).
  const avatar = member?.avatar?.startsWith("/team/")
    ? dataUri(
        await readFile(join(process.cwd(), "public", "team", basename(member.avatar))),
        "image/png",
      )
    : null;

  const name = member?.name ?? site.wordmark;
  const builds = member ? memberBuilds(member).map((p) => p.name) : [];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: background,
          padding: "64px 72px",
          fontFamily: "Inter Tight",
          color: ink,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src={mark} width={44} height={44} style={{ borderRadius: "12px" }} alt="" />
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 600 }}>
            binary<span style={{ color: blue }}>.</span>semaphore
          </div>
          <div style={{ display: "flex", marginLeft: "8px", fontSize: "24px", color: subtle }}>
            / team
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "680px" }}>
            <div
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: "84px",
                fontWeight: 700,
                letterSpacing: "-2.5px",
                lineHeight: 1,
              }}
            >
              {name}
            </div>
            {member ? (
              <div style={{ marginTop: "18px", fontSize: "36px", fontWeight: 600, color: accent }}>
                {member.role}
              </div>
            ) : null}
            {member?.description ? (
              <div style={{ marginTop: "18px", fontSize: "28px", lineHeight: 1.4, color: muted }}>
                {member.description}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", position: "relative", width: "280px", height: "280px" }}>
            <div
              style={{
                position: "absolute",
                top: "-14px",
                left: "-14px",
                width: "308px",
                height: "308px",
                borderRadius: "56px",
                backgroundColor: "#dbe6fb",
                transform: "rotate(6deg)",
              }}
            />
            {avatar ? (
              <img
                src={avatar}
                width={280}
                height={280}
                alt=""
                style={{ borderRadius: "48px", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "280px",
                  height: "280px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "48px",
                  backgroundColor: accent,
                  color: "#ffffff",
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "96px",
                  fontWeight: 700,
                }}
              >
                {initials(name)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {builds.length > 0 ? (
              <div style={{ display: "flex", fontSize: "22px", color: subtle, marginRight: "4px" }}>
                Building
              </div>
            ) : null}
            {builds.map((b) => (
              <div
                key={b}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: "14px",
                  border: `1px solid ${border}`,
                  backgroundColor: tray,
                  fontSize: "22px",
                  fontWeight: 600,
                  color: ink,
                }}
              >
                {b}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: "22px", color: subtle }}>
            binarysemaphore.com/team/{slug}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plus Jakarta Sans", data: display, weight: 700, style: "normal" },
        { name: "Inter Tight", data: sans, weight: 400, style: "normal" },
        { name: "Inter Tight", data: sansSemi, weight: 600, style: "normal" },
      ],
    },
  );
}
