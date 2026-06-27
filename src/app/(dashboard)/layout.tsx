import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { requireAuth } from "@/lib/dal";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuth();

  // A super-admin with no workspace belongs in the platform console.
  if (!ctx.organization) {
    redirect("/superadmin");
  }

  // Per-tenant accent override.
  const brandStyle = ctx.organization.brandColor
    ? ({ "--accent": ctx.organization.brandColor } as CSSProperties)
    : undefined;

  return (
    <div
      style={brandStyle}
      className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]"
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
      <Toaster
        position="bottom-right"
        toastOptions={{ className: "text-sm", style: { borderRadius: "0.75rem" } }}
      />
    </div>
  );
}
