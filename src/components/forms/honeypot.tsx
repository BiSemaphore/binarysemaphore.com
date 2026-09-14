"use client";
import { useEffect, useRef } from "react";
import { HONEYPOT_FIELD, STARTED_FIELD } from "@/lib/forms/spam";

/**
 * The two hidden inputs the spam check reads. Drop it inside any form that
 * posts to an inbox route. The honeypot is moved off screen rather than
 * `display: none`, because some bots skip fields they can tell are hidden.
 */
export function Honeypot() {
  // Stamped on the client after mount, straight into the input: a value
  // rendered on the server would differ from the client's and mismatch.
  const started = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (started.current) started.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>
      <input ref={started} type="hidden" name={STARTED_FIELD} defaultValue="" />
    </>
  );
}
