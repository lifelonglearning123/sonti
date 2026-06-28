"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminUsers,
  useInviteMember,
  useUpdateMember,
  useDeleteMember,
  useConnectionStatus,
  useSaveConnectionToken,
  type AdminMember,
} from "@/hooks/use-admin-users";
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
  Pencil,
  Trash2,
  Shield,
  User,
  Loader2,
  LogOut,
  MapPin,
  PlugZap,
  Check,
  Eye,
  EyeOff,
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

function ConnectionCard() {
  const { data: status, isLoading } = useConnectionStatus();
  const saveToken = useSaveConnectionToken();
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);

  const handleSave = async () => {
    if (!token.trim()) {
      toast.error("Paste the sub-account API token first");
      return;
    }
    try {
      await saveToken.mutateAsync(token.trim());
      toast.success("Sub-account connected");
      setToken("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              status?.connected
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
            )}
          >
            {status?.connected ? <Check className="h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              GHL sub-account {status?.connected ? "connected" : "not connected"}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">
              {isLoading
                ? "Checking…"
                : status?.hasToken
                ? "Connected with this sub-account's API token."
                : status?.oauthAvailable
                ? "Connected via the agency (OAuth). A token below is optional."
                : "Paste this sub-account's API token to enable the CRM."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{status?.hasToken ? "Replace API token" : "Sub-account API token"}</Label>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="pit-xxxxx…"
            className="font-mono text-xs pr-10"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            title={show ? "Hide token" : "Show token"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          Create it in GHL → this sub-account → Settings → Private Integrations.
        </p>
      </div>
      <Button onClick={handleSave} disabled={saveToken.isPending || !token.trim()} size="sm">
        {saveToken.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        Save &amp; verify
      </Button>
    </div>
  );
}

function MembersTab() {
  const { data, isLoading } = useAdminUsers();
  const invite = useInviteMember();
  const update = useUpdateMember();
  const remove = useDeleteMember();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMember | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminMember | null>(null);

  const members = data?.users || [];

  const openInvite = () => {
    setEditing(null);
    setEmail("");
    setFullName("");
    setRole("member");
    setPassword("");
    setDialogOpen(true);
  };

  const openEdit = (m: AdminMember) => {
    setEditing(m);
    setEmail(m.email);
    setFullName(m.fullName || "");
    setRole(m.role === "admin" ? "admin" : "member");
    setPassword("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          fullName: fullName || undefined,
          role: editing.role === "owner" ? undefined : role,
          password: password || undefined,
        });
        toast.success("Member updated");
      } else {
        if (!email) {
          toast.error("Email is required");
          return;
        }
        await invite.mutateAsync({ email, fullName: fullName || undefined, role });
        toast.success("Invitation sent");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success("Member removed");
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Members</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Invite teammates to your workspace. They get access to this location's CRM.
          </p>
        </div>
        <Button onClick={openInvite} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Invite member
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              {["Member", "Role", "Actions"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3",
                    h === "Actions" ? "text-right" : "text-left"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-secondary)]">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-28" />
                    </td>
                  ))}
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-sm text-[var(--text-tertiary)]">
                  No members yet. Invite your first teammate.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {m.role === "owner" || m.role === "admin" ? (
                        <Shield className="h-4 w-4 text-[var(--accent)]" />
                      ) : (
                        <User className="h-4 w-4 text-[var(--text-tertiary)]" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {m.fullName || m.email}
                        </div>
                        {m.fullName && (
                          <div className="text-xs text-[var(--text-tertiary)] truncate">
                            {m.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === "member" ? "secondary" : "default"} className="text-xs capitalize">
                      {m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                        title="Edit member"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {m.role !== "owner" && (
                        <button
                          onClick={() => setConfirmDelete(m)}
                          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit member" : "Invite member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@agency.com"
                disabled={!!editing}
              />
              {!editing && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  They'll get an email to set a password and join.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Rivera"
              />
            </div>

            {editing?.role !== "owner" && (
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("member")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                      role === "member"
                        ? "border-[var(--accent)] bg-[var(--accent-lighter)] text-[var(--accent)]"
                        : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    <User className="h-4 w-4 inline mr-1.5" />
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                      role === "admin"
                        ? "border-[var(--accent)] bg-[var(--accent-lighter)] text-[var(--accent)]"
                        : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    <Shield className="h-4 w-4 inline mr-1.5" />
                    Admin
                  </button>
                </div>
              </div>
            )}

            {editing && (
              <div className="space-y-2">
                <Label>Set a new password (optional)</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={invite.isPending || update.isPending}>
              {(invite.isPending || update.isPending) && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editing ? "Save changes" : "Send invite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Remove {confirmDelete?.fullName || confirmDelete?.email} from this workspace?
            They'll lose access immediately.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
              {remove.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <Loader2 className="h-8 w-8 text-[var(--text-tertiary)] animate-spin" />
      </div>
    );
  }

  const canAdmin = me?.orgRole === "owner" || me?.orgRole === "admin";
  if (!me?.authenticated || !canAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-6">
        <div className="text-center max-w-sm">
          <Shield className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">No access</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Only workspace owners and admins can manage members.
          </p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const locationName = me.locations[0]?.name || null;

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-primary)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                Workspace admin
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">{me.organization?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {locationName && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                {locationName}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <ConnectionCard />
        <MembersTab />
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
