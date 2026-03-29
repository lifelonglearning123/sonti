"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  Kanban,
  DollarSign,
  CalendarDays,
  Plus,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useContacts } from "@/hooks/use-contacts";
import { usePipelines, useOpportunities } from "@/hooks/use-opportunities";
import { useCalendars, useCalendarEvents } from "@/hooks/use-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";

// Animated number component
function AnimatedNumber({ value, isLoading }: { value: number; isLoading: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    if (isLoading) return;
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevValue.current = end;
  }, [value, isLoading]);

  return displayed;
}

function StatCard({
  label,
  value,
  numericValue,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string | number;
  numericValue?: number;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="relative overflow-hidden border-gray-200/80 dark:border-gray-800 shadow-sm card-hover bg-white dark:bg-gray-900">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 animate-count-up tabular-nums">
                {numericValue != null ? (
                  <AnimatedNumber value={numericValue} isLoading={isLoading} />
                ) : (
                  value
                )}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl",
              colorClasses[color] || colorClasses.blue
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";

  // Fetch data
  const { data: contactsData, isLoading: contactsLoading } = useContacts(
    locationId,
    "",
    1,
    1
  );
  const { data: pipelinesData, isLoading: pipelinesLoading } =
    usePipelines(locationId);

  const pipelines = pipelinesData?.pipelines || [];
  const firstPipelineId = pipelines[0]?.id || "";

  const { data: oppsData, isLoading: oppsLoading } = useOpportunities(
    locationId,
    firstPipelineId
  );

  // Calendar events for today
  const { data: calendarsData } = useCalendars(locationId);
  const calendarIds = (calendarsData?.calendars || []).map((c) => c.id);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents(
    locationId,
    calendarIds,
    todayStart.toISOString(),
    todayEnd.toISOString()
  );

  const opportunities = oppsData?.opportunities || [];
  const openDeals = opportunities.filter((o) => o.status === "open");
  const pipelineValue = openDeals.reduce(
    (sum, o) => sum + (o.monetaryValue || 0),
    0
  );
  const todayEvents = (eventsData?.events || []).filter(
    (e) => e.appointmentStatus !== "blocked" && e.status !== "blocked"
  );

  // Recent contacts (sorted by dateAdded)
  const recentContacts = useMemo(() => {
    const contacts = contactsData?.contacts || [];
    return contacts.slice(0, 5);
  }, [contactsData]);

  // Recent deal changes
  const recentDeals = useMemo(() => {
    return [...opportunities]
      .sort(
        (a, b) =>
          new Date(b.dateUpdated || b.updatedAt || b.dateAdded || 0).getTime() -
          new Date(a.dateUpdated || a.updatedAt || a.dateAdded || 0).getTime()
      )
      .slice(0, 5);
  }, [opportunities]);

  // Upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return todayEvents
      .filter((e) => new Date(e.startTime) >= now)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      .slice(0, 4);
  }, [todayEvents]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here is what is happening across your CRM today.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Contacts"
          value={contactsData?.total?.toLocaleString() ?? 0}
          numericValue={contactsData?.total ?? 0}
          icon={Users}
          color="blue"
          isLoading={contactsLoading}
        />
        <StatCard
          label="Open Deals"
          value={openDeals.length}
          numericValue={openDeals.length}
          icon={Kanban}
          color="green"
          isLoading={oppsLoading}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          icon={DollarSign}
          color="purple"
          isLoading={oppsLoading}
        />
        <StatCard
          label="Today's Appointments"
          value={todayEvents.length}
          numericValue={todayEvents.length}
          icon={CalendarDays}
          color="amber"
          isLoading={eventsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/contacts")}
          className="gap-2 btn-press"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Contact
          <span className="kbd ml-1">C</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pipeline")}
          className="gap-2 btn-press"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Deal
          <span className="kbd ml-1">D</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/calendar")}
          className="gap-2 btn-press"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Book Meeting
          <span className="kbd ml-1">N</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/conversations")}
          className="gap-2 btn-press"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Messages
          <span className="kbd ml-1">3</span>
        </Button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-gray-200/80 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/contacts")}
              className="text-xs text-gray-500 dark:text-gray-400 h-7"
            >
              View all
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <CardContent className="p-0">
            {contactsLoading || oppsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {recentDeals.slice(0, 5).map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() =>
                      router.push(`/pipeline/${deal.pipelineId}`)
                    }
                    className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-50 dark:bg-green-900/30">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {deal.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {deal.contact?.name || "No contact"} &middot;{" "}
                        {deal.status}
                        {deal.monetaryValue
                          ? ` · ${formatCurrency(deal.monetaryValue)}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                      {timeAgo(
                        deal.dateUpdated || deal.updatedAt || deal.dateAdded || ""
                      )}
                    </span>
                  </button>
                ))}
                {recentDeals.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    No recent deal activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-gray-200/80 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Today&apos;s Schedule
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/calendar")}
              className="text-xs text-gray-500 dark:text-gray-400 h-7"
            >
              View calendar
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-14 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {upcomingAppointments.map((event) => {
                  const start = new Date(event.startTime);
                  const end = new Date(event.endTime);
                  const timeStr = `${start.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })} - ${end.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}`;

                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center h-10 w-14 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <span className="text-xs font-bold leading-none">
                          {start.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            hour12: true,
                          })}
                        </span>
                        <span className="text-[10px] leading-none mt-0.5">
                          {start.getMinutes() > 0
                            ? `:${start.getMinutes().toString().padStart(2, "0")}`
                            : ""}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.title || "Untitled appointment"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</p>
                      </div>
                    </div>
                  );
                })}
                {upcomingAppointments.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    No upcoming appointments today
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
