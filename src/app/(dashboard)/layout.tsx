"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "text-sm",
          style: {
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}
