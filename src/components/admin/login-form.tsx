"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/admin/actions";
import { FIELD, LABEL, BUTTON } from "@/components/admin/ui";

const initial: SignInState = { error: null };

const field = `${FIELD} py-3`;

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className={LABEL}>
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
        <span className={LABEL}>
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
        className={`${BUTTON} py-3`}
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
