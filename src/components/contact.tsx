"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/lib/site";
import { MailIcon } from "@/components/icons";

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
      <p className="rounded-lg border border-accent/30 bg-card p-6 text-sm text-foreground">
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
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-foreground outline-none transition-colors focus:border-accent"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
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
      className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      <MailIcon className="h-4 w-4" />
      {site.email}
    </a>
  );
}

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-md bg-[radial-gradient(closest-side,var(--color-accent),transparent)] opacity-[0.12] blur-2xl"
          />
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Let&apos;s build something
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
            Using the tools, building something, or just want to compare notes
            on developer tooling? Get in touch.
          </p>
          <div className="mt-8 flex justify-center">
            {site.formspreeId ? (
              <ContactForm formspreeId={site.formspreeId} />
            ) : (
              <MailtoCard />
            )}
          </div>
          <p className="mt-10 font-mono text-xs text-subtle">
            Built by {site.name}, in the open.
          </p>
        </div>
      </div>
    </section>
  );
}
