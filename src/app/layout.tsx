import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Bricolage_Grotesque,
  Shantell_Sans,
  Caveat,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { site } from "@/lib/site";
import "./globals.css";

// Body / UI — clean and highly legible.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Code, labels, and metadata.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Display — a heavy, expressive grotesque for big headlines and brand moments.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Doodle accent — a marker variable font for the occasional hand-drawn moment.
const shantellSans = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  display: "swap",
});

// Handwritten — for annotations, asides, and doodle accents.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://binarysemaphore.com";
const brandTitle = `${site.wordmark} — developer tools`;
const description = `${site.wordmark}: ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: brandTitle,
    template: `%s · ${site.wordmark}`,
  },
  description,
  keywords: [
    "Binary Semaphore",
    "developer tools",
    "Go",
    "inode",
    "CLI",
    "semantic search",
  ],
  authors: [{ name: site.wordmark, url: siteUrl }],
  creator: site.wordmark,
  publisher: site.wordmark,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: site.wordmark,
    title: brandTitle,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: brandTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brandTitle,
    description,
    images: ["/og.png"],
  },
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
};

// Runs synchronously before first paint to set the theme class, avoiding a
// flash of the wrong theme. See Next.js "preventing flash before hydration".
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${shantellSans.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
