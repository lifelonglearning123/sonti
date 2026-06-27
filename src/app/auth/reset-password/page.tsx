"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck, Workflow } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );
    setIsLoading(false);
    if (resetError) {
      setError("We couldn't send a reset link. Try again in a moment.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
            <Workflow className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Sonti
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-sm)]">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-lighter)] text-[var(--accent)]">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                If an account exists for {email}, we've sent a link to reset your
                password.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Reset your password
              </h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-lg bg-[var(--accent-lighter)] px-3 py-2.5 text-sm text-[var(--accent-hover)]">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agency.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
