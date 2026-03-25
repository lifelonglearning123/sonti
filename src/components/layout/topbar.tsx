"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Search, LogOut, User, Bell, Settings, Command, Sun, Moon, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contacts": "Contacts",
  "/pipeline": "Pipeline",
  "/calendar": "Calendar",
  "/conversations": "Conversations",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, toggleTheme } = useTheme();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || "Dashboard";

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  const openShortcuts = () => {
    document.dispatchEvent(new CustomEvent("toggle-shortcuts"));
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f172a] shrink-0">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search / Command Palette trigger */}
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 h-9 px-3 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Keyboard shortcuts button */}
        <button
          onClick={openShortcuts}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-[18px] w-[18px]" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors btn-press"
          title={resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {resolvedTheme === "light" ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Notification bell */}
        <button className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E8553A] ring-2 ring-white dark:ring-[#0f172a]" />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700 transition-all">
              <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                {getInitials(session?.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
