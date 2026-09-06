import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { isAdmin } from "@/lib/admin/auth";
import { adminBase } from "@/lib/admin/paths";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const base = await adminBase();
  if (await isAdmin()) redirect(`${base}/`);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-subtle">
          Binary Semaphore
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
          Admin
        </h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-muted">
          Threads, subjects and channels. Signing in is not the same as having
          access here.
        </p>

        <LoginForm />

        {/* A second way in, not a second level of trust. Authorisation is the
            row in private.admins and the is_admin() check in every write
            policy; which credential opened the session does not enter into it.
            This exists because the accounts that predate the admin were all
            created through OAuth and have no password set. */}
        <div className="my-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <SignInButtons next={`${base}/`} />
      </div>
    </main>
  );
}
