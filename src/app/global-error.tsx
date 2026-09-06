"use client";

import { useEffect } from "react";

/**
 * The last resort: an error thrown in the root layout itself.
 *
 * Replaces the entire document, so it has to render its own <html> and <body>
 * and cannot rely on the app's fonts, tokens or stylesheet, since the failure
 * may be in whatever provides them. Everything here is inline on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f6f4",
          color: "#111111",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "2rem", margin: 0, letterSpacing: "-0.02em" }}>
            The site failed to load.
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.7, color: "#525252" }}>
            Something went wrong before the page could start. Reloading usually
            fixes it.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.25rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.8rem",
                color: "#767676",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: 0,
              borderRadius: "999px",
              background: "#111111",
              color: "#ffffff",
              padding: "0.7rem 1.4rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
