"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { site } from "@/lib/site";
import { Photo } from "@/components/photo";
import { ArrowUpRightIcon } from "@/components/icons";
import notesDark from "@/images/notes-dark.jpg";

type Status = "idle" | "submitting" | "success" | "error";

function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        form.reset();
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-xl border border-white/20 bg-white/5 p-6 text-sm text-white">
        Thanks, your message is on its way. We&apos;ll get back to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-xl gap-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-white/70">Name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-white/70">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="text-white/70">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="resize-y rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/50"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>
        {status === "error" ? (
          <span className="text-sm text-red-300">
            Something went wrong. Email us directly at{" "}
            <a href={`mailto:${site.email}`} className="text-white underline">
              {site.email}
            </a>
            .
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function Contact({ withForm = false }: { withForm?: boolean }) {
  return (
    <section id="contact" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-blob border border-band-border bg-band px-6 py-16 text-center shadow-soft sm:px-12 sm:py-20">
          {/* Atmospheric photo behind a darkening wash so text stays legible. */}
          <div className="absolute inset-0">
            <Photo
              src={notesDark}
              alt=""
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="h-full w-full"
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 120% at 50% -10%, rgba(30,30,30,0.80) 0%, rgba(17,17,17,0.93) 70%)",
            }}
          />

          <div className="relative z-10">
          <h2 className="text-balance text-4xl text-white sm:text-5xl lg:text-6xl">
            Let&apos;s build something
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-8 text-white/85">
            Using the tools, building something, or just want to compare notes
            on developer tooling? Get in touch.
          </p>
          <div className="mt-9 flex justify-center">
            {withForm ? (
              <ContactForm />
            ) : (
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-neutral-900 transition-transform hover:-translate-y-0.5"
              >
                Get in touch
                <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            )}
          </div>
          <p className="mt-10 font-mono text-xs text-white/70">
            {site.wordmark} · built in Go.
          </p>
          </div>
        </div>
      </div>
    </section>
  );
}
