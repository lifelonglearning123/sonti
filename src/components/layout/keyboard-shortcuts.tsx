"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["1"], description: "Go to Dashboard" },
      { keys: ["2"], description: "Go to Contacts" },
      { keys: ["3"], description: "Go to Conversations" },
      { keys: ["4"], description: "Go to Pipeline" },
      { keys: ["5"], description: "Go to Calendar" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["C"], description: "New contact" },
      { keys: ["D"], description: "New deal" },
      { keys: ["N"], description: "New appointment" },
      { keys: ["\u2318", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Esc"], description: "Close modal / panel" },
      { keys: ["\u2318", "\\"], description: "Toggle dark mode" },
    ],
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toggleTheme } = useTheme();

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    document.addEventListener("toggle-shortcuts", handleToggle);
    return () => document.removeEventListener("toggle-shortcuts", handleToggle);
  }, [handleToggle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // ? to toggle shortcuts overlay
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Close on Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      // Navigation shortcuts (1-5)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const navMap: Record<string, string> = {
          "1": "/dashboard",
          "2": "/contacts",
          "3": "/conversations",
          "4": "/pipeline",
          "5": "/calendar",
        };
        if (navMap[e.key]) {
          e.preventDefault();
          router.push(navMap[e.key]);
          return;
        }

        // Action shortcuts
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          router.push("/contacts");
          // Dispatch event that contacts page can listen for
          setTimeout(() => document.dispatchEvent(new CustomEvent("shortcut-new-contact")), 100);
          return;
        }
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          router.push("/pipeline");
          setTimeout(() => document.dispatchEvent(new CustomEvent("shortcut-new-deal")), 100);
          return;
        }
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          router.push("/calendar");
          setTimeout(() => document.dispatchEvent(new CustomEvent("shortcut-new-appointment")), 100);
          return;
        }
      }

      // Cmd+\ to toggle dark mode
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, router, toggleTheme]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-1/2 top-[15%] w-full max-w-xl -translate-x-1/2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Shortcuts */}
          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i}>
                            <kbd className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 font-mono">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="mx-0.5 text-gray-300 dark:text-gray-600">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Press <kbd className="kbd">?</kbd> anytime to toggle this overlay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
