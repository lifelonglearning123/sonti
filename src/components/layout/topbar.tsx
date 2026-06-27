"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  User,
  Bell,
  Settings,
  Command,
  Sun,
  Moon,
  Keyboard,
  Building2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useMe, useSetActiveLocation } from "@/hooks/use-me";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contacts": "Contacts",
  "/pipeline": "Pipeline",
  "/calendar": "Calendar",
  "/conversations": "Conversations",
  "/settings": "Settings",
  "/admin": "Admin",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { data: me } = useMe();
  const setActiveLocation = useSetActiveLocation();

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

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const locations = me?.locations ?? [];
  const activeLocation =
    locations.find((l) => l.ghlLocationId === me?.activeLocationId) ||
    locations[0];
  const displayName = me?.fullName || me?.email || "User";

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-[var(--border-primary)] bg-[var(--bg-sidebar)] shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>

        {/* Location switcher */}
        {locations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-9 max-w-[220px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] focus:outline-none">
              <Building2 className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
              <span className="truncate">
                {activeLocation?.name || "Select location"}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Switch location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {locations.map((loc) => {
                const isActive = loc.ghlLocationId === me?.activeLocationId;
                return (
                  <DropdownMenuItem
                    key={loc.ghlLocationId}
                    onClick={() =>
                      !isActive &&
                      setActiveLocation.mutate(loc.ghlLocationId)
                    }
                  >
                    <span className="flex-1 truncate">
                      {loc.name || loc.ghlLocationId}
                    </span>
                    {isActive && (
                      <Check className="ml-2 h-4 w-4 text-[var(--accent)]" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 h-9 px-3 w-64 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-[var(--border-primary)] bg-[var(--bg-card)] px-1.5 text-[10px] font-medium text-[var(--text-tertiary)]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <button
          onClick={openShortcuts}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={toggleTheme}
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors btn-press"
          title={resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {resolvedTheme === "light" ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )}
        </button>

        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="relative flex items-center justify-center h-9 w-9 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-sidebar)]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-[var(--border-primary)] transition-all">
              <AvatarFallback className="text-xs bg-[var(--accent-lighter)] text-[var(--accent)] font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{displayName}</span>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  {me?.organization?.name || me?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(me?.orgRole === "owner" || me?.orgRole === "admin") && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Settings className="mr-2 h-4 w-4" />
                Workspace admin
              </DropdownMenuItem>
            )}
            {me?.platformRole === "superadmin" && (
              <DropdownMenuItem onClick={() => router.push("/superadmin")}>
                <Building2 className="mr-2 h-4 w-4" />
                Platform console
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleSignOut}
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
