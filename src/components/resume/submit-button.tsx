"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/resume/spinner";

/**
 * A submit button that shows a pending state while its parent <form>'s server
 * action runs (e.g. create resume / use template, which insert + redirect).
 * Must be rendered inside the <form> it submits.
 */
export function SubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner className="h-3 w-3" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
