"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, Workflow } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  NoOrganization:
    "Your account isn't attached to a workspace yet. Contact your administrator.",
  Forbidden: "You don't have access to that area.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    const code = params.get("error");
    return code ? ERROR_MESSAGES[code] || "Something went wrong." : "";
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setIsLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("That email and password don't match. Try again.");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogle = async () => {
    setError("");
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-primary)]">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white bg-[linear-gradient(150deg,#E8553A_0%,#c23a22_60%,#7d2414_100%)]">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Workflow className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Sonti</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight">
            Every client,
            <br />
            one clean workspace.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/80">
            The CRM your agency runs on — contacts, conversations, pipeline, and
            calendar across every sub-account, under your brand.
          </p>
        </div>

        <div className="relative text-sm text-white/60">
          Multi-tenant CRM for modern agencies
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
              <Workflow className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Sonti
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Sign in to your workspace to continue.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/auth/reset-password"
                  className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-primary)]" />
            <span className="text-xs text-[var(--text-tertiary)]">or</span>
            <div className="h-px flex-1 bg-[var(--border-primary)]" />
          </div>

          <button
            onClick={handleGoogle}
            type="button"
            className="flex w-full h-11 items-center justify-center gap-2.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] btn-press"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-8 text-center text-xs text-[var(--text-tertiary)]">
            Workspaces are provisioned by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"
      />
    </svg>
  );
}
