"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/lib/site";
import { MailIcon } from "@/components/icons";
import { DotGrid } from "@/components/decoration";

type Status = "idle" | "submitting" | "success" | "error";

function ContactForm({ formspreeId }: { formspreeId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
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
      <p className="rounded-xl border border-accent/30 bg-card p-6 text-sm text-foreground">
        Thanks — your message is on its way. I&apos;ll get back to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-xl gap-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">Name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="resize-y rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>
        {status === "error" ? (
          <span className="text-sm text-red-500">
            Something went wrong — email me directly at{" "}
            <a href={`mailto:${site.email}`} className="underline">
              {site.email}
            </a>
            .
          </span>
        ) : null}
      </div>
    </form>
  );
}

function MailtoCard() {
  return (
    <a
      href={`mailto:${site.email}`}
      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-neutral-900 shadow-soft transition-transform hover:-translate-y-0.5"
    >
      <MailIcon className="h-4 w-4" />
      Email us
    </a>
  );
}

export function Contact() {
  const hasForm = Boolean(site.formspreeId);
  return (
    <section id="contact" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div
          className="relative overflow-hidden rounded-blob px-6 py-16 text-center shadow-soft sm:px-12 sm:py-20"
          style={{
            background: "linear-gradient(120deg, var(--coral), var(--violet))",
          }}
        >
          <DotGrid className="text-white/15" />
          <h2 className="text-balance text-4xl text-white sm:text-5xl lg:text-6xl">
            Let&apos;s build something
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-8 text-white/85">
            Using the tools, building something, or just want to compare notes
            on developer tooling? Get in touch.
          </p>
          <div className="mt-9 flex justify-center">
            {hasForm ? (
              <div className="w-full max-w-xl rounded-panel bg-card p-6 text-left shadow-soft sm:p-8">
                <ContactForm formspreeId={site.formspreeId} />
              </div>
            ) : (
              <MailtoCard />
            )}
          </div>
          <p className="mt-10 font-mono text-xs text-white/70">
            {site.wordmark} · open source, built in Go.
          </p>
        </div>
      </div>
    </section>
  );
}
