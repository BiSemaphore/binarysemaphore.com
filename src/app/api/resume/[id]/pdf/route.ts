import { NextResponse, type NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";

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
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: resume.pageSize === "letter" ? "letter" : "a4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
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
