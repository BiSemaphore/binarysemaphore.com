"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Toggles `.dark` on <html> and persists the choice to localStorage.
 * The initial class is set by the inline script in layout.tsx (no flash).
 * Which icon shows is driven purely by CSS (`dark:` variants) off that class,
 * so there's no React state and no SSR/CSR mismatch.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${className || "border-border text-muted hover:bg-card-hover hover:text-foreground"}`}
    >
      <SunIcon className="hidden h-[18px] w-[18px] dark:block" />
      <MoonIcon className="h-[18px] w-[18px] dark:hidden" />
    </button>
  );
}
