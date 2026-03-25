"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  MessageSquare,
  Kanban,
  Calendar,
  Settings,
  Search,
  ArrowRight,
  Clock,
  Hash,
  LayoutDashboard,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, toggleTheme } = useTheme();

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Go to overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      category: "Navigation",
      shortcut: "1",
      action: () => navigate("/dashboard"),
    },
    {
      id: "contacts",
      label: "Contacts",
      description: "View all contacts",
      icon: <Users className="h-4 w-4" />,
      category: "Navigation",
      shortcut: "2",
      action: () => navigate("/contacts"),
    },
    {
      id: "conversations",
      label: "Conversations",
      description: "View messages",
      icon: <MessageSquare className="h-4 w-4" />,
      category: "Navigation",
      shortcut: "3",
      action: () => navigate("/conversations"),
    },
    {
      id: "pipeline",
      label: "Pipeline",
      description: "Manage deals",
      icon: <Kanban className="h-4 w-4" />,
      category: "Navigation",
      shortcut: "4",
      action: () => navigate("/pipeline"),
    },
    {
      id: "calendar",
      label: "Calendar",
      description: "View appointments",
      icon: <Calendar className="h-4 w-4" />,
      category: "Navigation",
      shortcut: "5",
      action: () => navigate("/calendar"),
    },
    {
      id: "settings",
      label: "Settings",
      description: "Manage your account",
      icon: <Settings className="h-4 w-4" />,
      category: "Navigation",
      action: () => navigate("/settings"),
    },
    {
      id: "new-contact",
      label: "New Contact",
      description: "Create a contact",
      icon: <Plus className="h-4 w-4" />,
      category: "Actions",
      shortcut: "C",
      action: () => {
        navigate("/contacts");
        setTimeout(() => document.dispatchEvent(new CustomEvent("shortcut-new-contact")), 100);
      },
    },
    {
      id: "new-deal",
      label: "New Deal",
      description: "Create a deal",
      icon: <Plus className="h-4 w-4" />,
      category: "Actions",
      shortcut: "D",
      action: () => {
        navigate("/pipeline");
        setTimeout(() => document.dispatchEvent(new CustomEvent("shortcut-new-deal")), 100);
      },
    },
    {
      id: "toggle-theme",
      label: resolvedTheme === "light" ? "Dark Mode" : "Light Mode",
      description: "Toggle theme",
      icon: resolvedTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
      category: "Actions",
      action: () => {
        toggleTheme();
        setOpen(false);
        setQuery("");
      },
    },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  const flatItems = Object.values(grouped).flat();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) {
        if (query) {
          setRecentSearches((prev) =>
            [query, ...prev.filter((s) => s !== query)].slice(0, 5)
          );
        }
        item.action();
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => {
          setOpen(false);
          setQuery("");
        }}
      />

      {/* Panel */}
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type a command..."
              className="flex-1 px-3 py-3.5 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent text-gray-900 dark:text-white"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {recentSearches.length > 0 && !query && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Recent
                </p>
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {category}
                </p>
                {items.map((item) => {
                  const index = flatItems.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        index === selectedIndex
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <span
                        className={cn(
                          "shrink-0",
                          index === selectedIndex ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="kbd">{item.shortcut}</kbd>
                      )}
                      {item.description && !item.shortcut && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{item.description}</span>
                      )}
                      {index === selectedIndex && (
                        <ArrowRight className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {flatItems.length === 0 && (
              <div className="py-8 text-center">
                <Hash className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="kbd">&uarr;</kbd>
                <kbd className="kbd">&darr;</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">&crarr;</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">?</kbd>
                Shortcuts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
