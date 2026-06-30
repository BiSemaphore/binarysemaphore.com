import { NextResponse, type NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";
import { isTrustedHost } from "@/lib/subdomains";

// Headless Chromium needs the full Node runtime, and the render can take a few
// seconds on a cold start.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Render a resume to a PDF and return it as a direct download (no browser print
 * dialog). We load the chrome-free /print/[id] page in headless Chromium,
 * forwarding the caller's auth cookies so that page authenticates as this user
 * (RLS scopes the data). On Vercel we use @sparticuz/chromium; locally we drive
 * the installed Chrome.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  // Never point Chromium (carrying the user's cookies) at an untrusted host.
  if (!isTrustedHost(host)) {
    return NextResponse.json({ error: "Bad host" }, { status: 400 });
  }
  const origin = `${proto}://${host}`;
  const printUrl = `${origin}/print/${id}`;

  const isServerless = Boolean(process.env.VERCEL);
  const browser = await puppeteer.launch(
    isServerless
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        }
      : { channel: "chrome", headless: true },
  );

  try {
    const page = await browser.newPage();

    // Forward the caller's cookies so the print page authenticates as them.
    const cookies = request.cookies.getAll().map((c) => ({
      name: c.name,
      value: c.value,
      url: origin,
    }));
    if (cookies.length) await page.setCookie(...cookies);

    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // If the forwarded session didn't authenticate, the print page redirects to
    // the login screen. Never turn that into a "resume" PDF — fail clearly so
    // the client surfaces an export error instead of downloading the login page.
    if (!page.url().includes(`/print/${id}`)) {
      return NextResponse.json(
        { error: "Could not render resume" },
        { status: 502 },
      );
    }

    await page.emulateMediaType("print");

    // The print page paginates client-side after fonts load, then flags
    // <html data-print-ready="1">. Wait for that (with a short settle) so we
    // capture the final, stable layout rather than a half-measured one.
    await page
      .waitForSelector("html[data-print-ready='1']", { timeout: 15000 })
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 300));

    // Page size comes from the print page's @page rule; each sheet is already a
    // full page with its margins baked in, so @page margin is 0.
    const pdf = await page.pdf({
      format: resume.pageSize === "letter" ? "letter" : "a4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const filename = `${(resume.title || "resume")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "resume"}.pdf`;

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
