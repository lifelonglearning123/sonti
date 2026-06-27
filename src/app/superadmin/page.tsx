"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
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
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("free");
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
    try {
      await createOrg.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || undefined,
        plan,
      });
      toast.success("Organization created — owner invited by email");
      setName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerName("");
      setPlan("free");
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Organizations</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Provision agencies and manage their plans and access.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
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

                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org.memberCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {org.locationCount}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      org.ghlConnected ? "text-green-600 dark:text-green-400" : ""
                    )}
                  >
                    <PlugZap className="h-3.5 w-3.5" />
                    {org.ghlConnected ? "GHL" : "No GHL"}
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
            locations, and all member accounts that don't belong to another workspace.
            This can't be undone.
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
