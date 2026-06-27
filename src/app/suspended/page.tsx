"use client";

import { useRouter } from "next/navigation";
import { PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SuspendedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <PauseCircle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Workspace paused
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This workspace is currently inactive. Reach out to your platform
          administrator to restore access.
        </p>
        <Button variant="outline" className="mt-6" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
