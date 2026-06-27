"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminUsers,
  useInviteMember,
  useUpdateMember,
  useDeleteMember,
  useAgencySettings,
  useSaveAgencyToken,
  useGhlLocations,
  useCreateGhlLocation,
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
  Check,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Settings,
  Users,
  Building2,
  MapPin,
  PlugZap,
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

type Tab = "members" | "connection" | "locations";

// ─── Members ────────────────────────────────────────────────
function MembersTab() {
  const { data, isLoading } = useAdminUsers();
  const { data: locationsData } = useGhlLocations();
  const invite = useInviteMember();
  const update = useUpdateMember();
  const remove = useDeleteMember();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMember | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [locationId, setLocationId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminMember | null>(null);

  const members = data?.users || [];
  const locations = locationsData?.locations || [];
  const locationNames = new Map(locations.map((l) => [l.id, l.name]));

  const openInvite = () => {
    setEditing(null);
    setEmail("");
    setFullName("");
    setRole("member");
    setLocationId("");
    setPassword("");
    setDialogOpen(true);
  };

  const openEdit = (m: AdminMember) => {
    setEditing(m);
    setEmail(m.email);
    setFullName(m.fullName || "");
    setRole(m.role === "admin" ? "admin" : "member");
    setLocationId(m.ghlLocationId || "");
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
          ghlLocationId: locationId || null,
          password: password || undefined,
        });
        toast.success("Member updated");
      } else {
        if (!email) {
          toast.error("Email is required");
          return;
        }
        await invite.mutateAsync({
          email,
          fullName: fullName || undefined,
          role,
          ghlLocationId: locationId || undefined,
        });
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
            Invite teammates and set what each can access.
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
              {["Member", "Role", "Location", "Actions"].map((h) => (
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
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-28" />
                    </td>
                  ))}
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-sm text-[var(--text-tertiary)]">
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
                  <td className="px-4 py-3">
                    {m.ghlLocationId ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-[var(--accent)]" />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {locationNames.get(m.ghlLocationId) ||
                            `${m.ghlLocationId.slice(0, 10)}…`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)]">All locations</span>
                    )}
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

            <div className="space-y-2">
              <Label>Assigned location</Label>
              <select
                aria-label="Assigned location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

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

// ─── Connection ─────────────────────────────────────────────
function ConnectionTab() {
  const { data: settings, isLoading } = useAgencySettings();
  const saveToken = useSaveAgencyToken();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleSave = async () => {
    if (!token.trim()) {
      toast.error("Enter an agency token first");
      return;
    }
    try {
      await saveToken.mutateAsync(token.trim());
      toast.success("Agency connected");
      setToken("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await fetch("/api/admin/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success("Disconnected");
      window.location.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">GHL connection</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Connect your GoHighLevel agency to sync sub-accounts into this workspace.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
        {isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : settings?.hasToken ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Connected</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {settings.agencyName || "Agency"}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
              Active
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Not connected</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Connect with OAuth, or paste a private integration token.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => (window.location.href = "/api/ghl/oauth/start")} size="sm">
            <PlugZap className="h-4 w-4 mr-1.5" />
            Connect with OAuth
          </Button>
          {settings?.hasToken && (
            <Button
              onClick={handleDisconnect}
              size="sm"
              variant="outline"
              disabled={disconnecting}
            >
              {disconnecting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Disconnect
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>{settings?.hasToken ? "Replace token" : "Agency private integration token"}</Label>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="pit-xxxxx…"
              className="font-mono text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              title={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            GHL → Agency Settings → Developer → Private Integrations
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveToken.isPending || !token.trim()} size="sm">
          {saveToken.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Save &amp; verify
        </Button>
      </div>
    </div>
  );
}

// ─── Locations ──────────────────────────────────────────────
function LocationsTab() {
  const { data: settings } = useAgencySettings();
  const { data, isLoading } = useGhlLocations(!!settings?.hasToken);
  const createLocation = useCreateGhlLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const locations = data?.locations || [];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Business name is required");
      return;
    }
    try {
      await createLocation.mutateAsync({
        name: name.trim(),
        email: email || undefined,
        phone: phone || undefined,
      });
      toast.success(`Created ${name}`);
      setName("");
      setEmail("");
      setPhone("");
      setDialogOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!settings?.hasToken) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-primary)] p-10 text-center">
        <Building2 className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-primary)]">No GHL connection</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Connect your agency in the Connection tab to see and create sub-accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Locations</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Sub-accounts synced from your GHL agency.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New sub-account
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <p className="text-center py-8 text-sm text-[var(--text-tertiary)]">
            No sub-accounts found under this agency.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-secondary)]">
            {locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="h-4 w-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {l.name}
                    </div>
                    {l.email && (
                      <div className="text-xs text-[var(--text-tertiary)] truncate">{l.email}</div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">
                  {l.id.slice(0, 8)}…
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New sub-account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Marketing" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@acme.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLocation.isPending}>
              {createLocation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "members", label: "Members", icon: Users },
  { id: "connection", label: "Connection", icon: Settings },
  { id: "locations", label: "Locations", icon: Building2 },
];

export default function AdminPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const [tab, setTab] = useState<Tab>("members");

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
            Only workspace owners and admins can manage settings.
          </p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="bg-[var(--bg-card)] border-b border-[var(--border-primary)]">
        <div className="max-w-5xl mx-auto flex gap-1 px-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {tab === "members" && <MembersTab />}
        {tab === "connection" && <ConnectionTab />}
        {tab === "locations" && <LocationsTab />}
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
