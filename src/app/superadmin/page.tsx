"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useAgencyStatus,
  useDisconnectAgency,
  useAgencySubAccounts,
  type SuperAdminOrg,
} from "@/hooks/use-superadmin";
import { useMe } from "@/hooks/use-me";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Building2,
  LogOut,
  Users,
  MapPin,
  PlugZap,
  Pause,
  Play,
  Trash2,
  Check,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return "Request failed";
}

const PLANS = ["free", "starter", "pro"] as const;

export default function SuperAdminPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useMe();
  const { data, isLoading } = useOrganizations();
  const { data: agency } = useAgencyStatus();
  const disconnectAgency = useDisconnectAgency();
  const createOrg = useCreateOrganization();
  const { data: subAccountsData } = useAgencySubAccounts();
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("free");
  const [subMode, setSubMode] = useState<"create" | "existing">("create");
  const [ghlLocationId, setGhlLocationId] = useState("");
  const [locationApiToken, setLocationApiToken] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<SuperAdminOrg | null>(null);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCreate = async () => {
    if (!name.trim() || !ownerEmail.trim()) {
      toast.error("Organization name and owner email are required");
      return;
    }
    if (subMode === "existing" && !ghlLocationId) {
      toast.error("Pick the existing sub-account to link");
      return;
    }
    try {
      await createOrg.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || undefined,
        plan,
        mode: subMode,
        ghlLocationId: subMode === "existing" ? ghlLocationId : undefined,
        locationApiToken: locationApiToken.trim() || undefined,
      });
      toast.success("Organization created — owner invited by email");
      setName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerName("");
      setPlan("free");
      setSubMode("create");
      setGhlLocationId("");
      setLocationApiToken("");
      setDialogOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleActive = async (org: SuperAdminOrg) => {
    try {
      await updateOrg.mutateAsync({ id: org.id, isActive: !org.isActive });
      toast.success(org.isActive ? "Workspace suspended" : "Workspace reactivated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const changePlan = async (org: SuperAdminOrg, next: (typeof PLANS)[number]) => {
    try {
      await updateOrg.mutateAsync({ id: org.id, plan: next });
      toast.success(`Plan set to ${next}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteOrg.mutateAsync(confirmDelete.id);
      toast.success("Organization deleted");
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <Loader2 className="h-8 w-8 text-[var(--text-tertiary)] animate-spin" />
      </div>
    );
  }

  if (me?.platformRole !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-6">
        <div className="text-center max-w-sm">
          <Building2 className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Platform access only</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            This console is restricted to platform administrators.
          </p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const orgs = data?.organizations || [];

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-primary)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                Platform console
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">{me.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Agency connection — OAuth and/or env PIT */}
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  agency?.connected
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                )}
              >
                {agency?.connected ? <Check className="h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {agency?.connected ? "GHL agency connected" : "GHL agency not connected"}
                  {agency?.activeMethod && (
                    <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)] border border-[var(--border-primary)] rounded px-1.5 py-0.5">
                      {agency.activeMethod === "oauth" ? "OAuth" : "env PIT"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {agency?.connected
                    ? `${agency.agencyName ? agency.agencyName + " — " : ""}${agency.subAccountCount ?? 0} sub-account${agency.subAccountCount === 1 ? "" : "s"} visible`
                    : "Connect via OAuth, or set GHL_AGENCY_API_TOKEN + GHL_COMPANY_ID in env."}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        agency?.oauthConnected ? "bg-green-500" : "bg-[var(--border-primary)]"
                      )}
                    />
                    OAuth
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        agency?.pitConfigured ? "bg-green-500" : "bg-[var(--border-primary)]"
                      )}
                    />
                    env PIT
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {agency?.oauthConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await disconnectAgency.mutateAsync();
                      toast.success("OAuth disconnected");
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                  disabled={disconnectAgency.isPending}
                >
                  {disconnectAgency.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Disconnect OAuth
                </Button>
              ) : (
                <Button size="sm" onClick={() => (window.location.href = "/api/oauth/start")}>
                  <PlugZap className="h-4 w-4 mr-1.5" />
                  Connect via OAuth
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Organizations</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Each organization is a GHL sub-account with its own admin.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            disabled={!agency?.connected}
            title={agency?.connected ? undefined : "Connect the agency first"}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New organization
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-primary)] p-12 text-center">
            <Building2 className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-primary)]">No organizations yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Create the first agency workspace to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <div
                key={org.id}
                className={cn(
                  "rounded-xl border bg-[var(--bg-card)] p-5 flex flex-col gap-4",
                  org.isActive
                    ? "border-[var(--border-primary)]"
                    : "border-amber-300 dark:border-amber-800"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {org.name}
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {org.ownerEmail || "No owner"}
                    </p>
                  </div>
                  {org.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                      Suspended
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] min-w-0">
                  <span className="flex items-center gap-1 shrink-0">
                    <Users className="h-3.5 w-3.5" />
                    {org.memberCount}
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{org.locationName || "—"}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-[var(--text-tertiary)]">Plan</Label>
                  <div className="flex gap-1">
                    {PLANS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => org.plan !== p && changePlan(org, p)}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                          org.plan === p
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(org)}
                  >
                    {org.isActive ? (
                      <>
                        <Pause className="h-3.5 w-3.5 mr-1.5" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Reactivate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setConfirmDelete(org)}
                    title="Delete organization"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create org dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Organization name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Agency"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (optional)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-agency"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner email</Label>
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@acme.com"
              />
              <p className="text-xs text-[var(--text-tertiary)]">
                The owner gets an email to set their password and sign in.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Owner name (optional)</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jordan Rivera"
              />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <div className="flex gap-1">
                {PLANS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-colors",
                      plan === p
                        ? "border-[var(--accent)] bg-[var(--accent-lighter)] text-[var(--accent)]"
                        : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>GHL sub-account</Label>
              <div className="flex gap-1">
                {(["create", "existing"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSubMode(m)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                      subMode === m
                        ? "border-[var(--accent)] bg-[var(--accent-lighter)] text-[var(--accent)]"
                        : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {m === "create" ? "Create new" : "Link existing"}
                  </button>
                ))}
              </div>
            </div>

            {subMode === "existing" && (
              <div className="space-y-2">
                <Label>Existing sub-account</Label>
                <select
                  aria-label="Existing sub-account"
                  value={ghlLocationId}
                  onChange={(e) => setGhlLocationId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="">Select a sub-account…</option>
                  {(subAccountsData?.subAccounts || []).map((s) => (
                    <option key={s.id} value={s.id} disabled={s.bound}>
                      {s.name}
                      {s.bound ? " (already linked)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Sub-account API token{subMode === "existing" ? "" : " (optional)"}
              </Label>
              <Input
                value={locationApiToken}
                onChange={(e) => setLocationApiToken(e.target.value)}
                placeholder="pit-xxxxx…"
                className="font-mono text-xs"
              />
              <p className="text-xs text-[var(--text-tertiary)]">
                {subMode === "existing"
                  ? "That sub-account's own Private Integration token (GHL → that sub-account → Settings → Private Integrations)."
                  : "A new sub-account has no token yet — leave blank and add it later from the workspace admin (or rely on OAuth)."}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createOrg.isPending}>
              {createOrg.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Permanently delete {confirmDelete?.name}? This removes its GHL connection,
            locations, and all member accounts that don’t belong to another workspace.
            This can’t be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOrg.isPending}>
              {deleteOrg.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" />
    </div>
  );
}
