"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/admin/actions";

const initial: SignInState = { error: null };

const field =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus:border-foreground";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          className={field}
          placeholder="you@binarysemaphore.com"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </label>

      {/* aria-live so a screen reader hears the failure, which is the only
          feedback this form gives. */}
      <p aria-live="polite" className="min-h-5 text-sm text-coral">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
