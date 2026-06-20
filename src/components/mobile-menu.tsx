"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MenuIcon, CloseIcon, ArrowUpRightIcon } from "@/components/icons";
import type { NavItem } from "@/components/header";

/**
 * Mobile-only nav: a hamburger that opens a full-width sheet under the header.
 * Mirrors the desktop company structure, with dropdown groups shown as labeled
 * sections. Closes on Escape, on navigation, and locks body scroll while open.
 */
export function MobileMenu({
  items,
  authed = false,
}: {
  items: NavItem[];
  authed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-card-hover"
      >
        {open ? (
          <CloseIcon className="h-[18px] w-[18px]" />
        ) : (
          <MenuIcon className="h-[18px] w-[18px]" />
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto bg-background">
          <nav className="mx-auto w-full max-w-7xl px-6">
            <ul className="flex flex-col py-4">
              {items.map((item) =>
                item.type === "dropdown" ? (
                  <li key={item.label} className="border-b border-border py-3">
                    <p className="pt-1 pb-1 font-mono text-xs uppercase tracking-[0.2em] text-subtle">
                      {item.label}
                    </p>
                    <ul>
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={close}
                            className="block py-2.5 text-xl font-medium text-foreground"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block border-b border-border py-4 text-2xl font-medium tracking-[-0.02em] text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
              <li>
                <Link
                  href={authed ? "/account" : "/login"}
                  onClick={close}
                  className="block border-b border-border py-4 text-2xl font-medium tracking-[-0.02em] text-foreground"
                >
                  {authed ? "Account" : "Sign in"}
                </Link>
              </li>
            </ul>
            <Link
              href="/contact"
              onClick={close}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-base font-semibold text-background"
            >
              Get in touch
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
