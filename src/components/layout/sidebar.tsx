"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  MessageSquare,
  Kanban,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Workflow,
  LayoutDashboard,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "1" },
  { href: "/contacts", label: "Contacts", icon: Users, shortcut: "2" },
  { href: "/conversations", label: "Conversations", icon: MessageSquare, shortcut: "3" },
  { href: "/pipeline", label: "Pipeline", icon: Kanban, shortcut: "4" },
  { href: "/calendar", label: "Calendar", icon: Calendar, shortcut: "5" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: me } = useMe();
  const brandName = me?.organization?.brandName || "Sonti";

  const isOrgAdmin = me?.orgRole === "owner" || me?.orgRole === "admin";
  const isSuperAdmin = me?.platformRole === "superadmin";

  // Bottom section: role-gated admin links + Settings.
  const bottomItems: NavItem[] = [
    ...(isSuperAdmin
      ? [{ href: "/superadmin", label: "Platform console", icon: Building2 }]
      : []),
    ...(isOrgAdmin
      ? [{ href: "/admin", label: "Workspace admin", icon: Shield }]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = pathname.startsWith(item.href);
    const link = (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-100/50 dark:shadow-none"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200",
          collapsed && "justify-center px-0"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
        )}
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            isActive
              ? "text-blue-700 dark:text-blue-400"
              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          )}
        />
        <span
          className={cn(
            "transition-all duration-300 flex-1",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}
        >
          {item.label}
        </span>
        {!collapsed && item.shortcut && (
          <span className="kbd opacity-0 group-hover:opacity-100 transition-opacity">
            {item.shortcut}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
            {item.shortcut && <span className="ml-2 kbd">{item.shortcut}</span>}
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.href}>{link}</div>;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[68px]" : "w-[240px]",
          "max-md:absolute max-md:z-30 max-md:h-full"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8553A] to-[#D4442B] shadow-sm shadow-[#E8553A]/25">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <span
            className={cn(
              "text-lg font-bold text-gray-900 dark:text-white tracking-tight transition-all duration-300 truncate",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {brandName}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">{navItems.map(renderItem)}</nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {bottomItems.map(renderItem)}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center w-full py-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200",
              collapsed ? "justify-center" : "justify-end px-3"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
