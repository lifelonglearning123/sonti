"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useAgencySettings, useSaveAgencyToken,
  useGhlLocations, useCreateGhlLocation,
} from "@/hooks/use-admin-users";
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
  Plus, Pencil, Trash2, Shield, User, Check, Eye, EyeOff,
  Loader2, LogIn, LogOut, Settings, Users, Building2, MapPin, Search,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

interface UserFormData {
  username: string;
  password: string;
  role: string;
  ghlLocationId: string;
  ghlAccessToken: string;
  locationMode: "manual" | "existing" | "create";
  newLocationName: string;
  newLocationEmail: string;
  newLocationPhone: string;
}

const emptyForm: UserFormData = {
  username: "",
  password: "",
  role: "user",
  ghlLocationId: "",
  ghlAccessToken: "",
  locationMode: "existing",
  newLocationName: "",
  newLocationEmail: "",
  newLocationPhone: "",
};

// ─── Admin Login ───────────────────────────────────────────
function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Please enter username and password"); return; }
    setIsLoading(true);
    setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    if (result?.ok) { window.location.reload(); return; }
    setError("Invalid admin credentials");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 dark:bg-gray-800 mb-6">
            <Shield className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
          <p className="text-gray-500 dark:text-gray-400">Sign in to manage users</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Signing in...</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Admin username" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" />
              </div>
              <Button type="submit" className="w-full h-11"><LogIn className="h-4 w-4 mr-2" />Sign in</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────
function SettingsTab() {
  const { data: settings, isLoading } = useAgencySettings();
  const saveToken = useSaveAgencyToken();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSave = async () => {
    if (!token.trim()) { toast.error("Please enter an agency token"); return; }
    try {
      const result = await saveToken.mutateAsync(token.trim());
      toast.success(`Connected to ${(result as any).agencyName || "agency"}`);
      setToken("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify token");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agency Connection</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Connect your GoHighLevel agency to manage sub-accounts.
        </p>
      </div>

      {/* Current status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : settings?.hasToken ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Connected</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {settings.agencyName || "Agency"} {settings.companyId ? `(${settings.companyId.substring(0, 8)}...)` : ""}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">Active</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Not connected</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enter your agency token below to connect.</p>
            </div>
          </div>
        )}
      </div>

      {/* Token input */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="space-y-2">
          <Label>{settings?.hasToken ? "Update Agency Token" : "Agency Private Integration Token"}</Label>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="pit-xxxxx..."
              className="font-mono text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Find this in GHL Agency Settings &rarr; Developer &rarr; Private Integrations
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveToken.isPending || !token.trim()} size="sm">
          {saveToken.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Save &amp; Verify
        </Button>
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────
function UsersTab() {
  const { data: session } = useSession();
  const { data, isLoading } = useAdminUsers();
  const { data: settings } = useAgencySettings();
  const { data: locationsData } = useGhlLocations(!!settings?.hasToken);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const createLocation = useCreateGhlLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showToken, setShowToken] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  const users = data?.users || [];
  const locations = locationsData?.locations || [];
  const hasAgency = !!settings?.hasToken;

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.id.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Map location IDs to names for display
  const locationNames = new Map(locations.map((l) => [l.id, l.name]));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, locationMode: hasAgency ? "existing" : "manual" });
    setShowToken(false);
    setLocationSearch("");
    setDialogOpen(true);
  };

  const openEdit = (user: typeof users[0]) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role,
      ghlLocationId: user.ghlLocationId || "",
      ghlAccessToken: "",
      locationMode: hasAgency ? "existing" : "manual",
      newLocationName: "",
      newLocationEmail: "",
      newLocationPhone: "",
    });
    setShowToken(false);
    setLocationSearch("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      let locationId = form.ghlLocationId;
      let accessToken = form.ghlAccessToken;

      // If creating a new location
      if (form.locationMode === "create" && form.newLocationName) {
        const result = await createLocation.mutateAsync({
          name: form.newLocationName,
          email: form.newLocationEmail || undefined,
          phone: form.newLocationPhone || undefined,
        });
        locationId = (result as any).location?.id || "";
        toast.success(`Created location: ${form.newLocationName}`);
      }

      if (editingId) {
        const payload: Record<string, string> = {};
        if (form.username) payload.username = form.username;
        if (form.password) payload.password = form.password;
        if (form.role) payload.role = form.role;
        if (locationId) payload.ghlLocationId = locationId;
        if (accessToken) payload.ghlAccessToken = accessToken;

        await updateUser.mutateAsync({ id: editingId, ...payload });
        toast.success("User updated");
      } else {
        if (!form.username || !form.password) {
          toast.error("Username and password are required");
          return;
        }
        await createUser.mutateAsync({
          username: form.username,
          password: form.password,
          role: form.role,
          ghlLocationId: locationId || undefined,
          ghlAccessToken: accessToken || undefined,
        });
        toast.success("User created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteUser.mutateAsync(deletingId);
      toast.success("User deleted");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create user accounts and link their CRM connections.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1.5" />Add User</Button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                  No users yet. Click "Add User" to create one.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.role === "admin" ? <Shield className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.ghlLocationId ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {locationNames.get(user.ghlLocationId) || `${user.ghlLocationId.substring(0, 10)}...`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">Not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.hasToken ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" />Connected
                      </Badge>
                    ) : user.ghlLocationId ? (
                      <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                        No token
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit user">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setDeletingId(user.id); setDeleteDialogOpen(true); }} className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete user">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* Username & Password */}
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Enter username" />
            </div>
            <div className="space-y-2">
              <Label>{editingId ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "Leave blank to keep" : "Enter password"} />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, role: "user" })} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors", form.role === "user" ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                  <User className="h-4 w-4 inline mr-1.5" />User
                </button>
                <button type="button" onClick={() => setForm({ ...form, role: "admin" })} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors", form.role === "admin" ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                  <Shield className="h-4 w-4 inline mr-1.5" />Admin
                </button>
              </div>
            </div>

            {/* CRM Connection */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">CRM Connection</p>

              {/* Mode selector (only show if agency connected) */}
              {hasAgency && (
                <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {(["existing", "create", "manual"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, locationMode: mode })}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
                        form.locationMode === mode
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      {mode === "existing" ? "Pick Location" : mode === "create" ? "New Location" : "Manual"}
                    </button>
                  ))}
                </div>
              )}

              {/* Pick existing location */}
              {form.locationMode === "existing" && hasAgency && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {filteredLocations.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No locations found</p>
                    ) : (
                      filteredLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => setForm({ ...form, ghlLocationId: loc.id })}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors",
                            form.ghlLocationId === loc.id
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <div className="font-medium">{loc.name}</div>
                          {loc.email && <div className="text-gray-400 dark:text-gray-500 mt-0.5">{loc.email}</div>}
                        </button>
                      ))
                    )}
                  </div>
                  {form.ghlLocationId && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Selected: {locationNames.get(form.ghlLocationId) || form.ghlLocationId}
                    </p>
                  )}
                </div>
              )}

              {/* Create new location */}
              {form.locationMode === "create" && hasAgency && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Business Name *</Label>
                    <Input value={form.newLocationName} onChange={(e) => setForm({ ...form, newLocationName: e.target.value })} placeholder="e.g. Acme Marketing" className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Email</Label>
                    <Input value={form.newLocationEmail} onChange={(e) => setForm({ ...form, newLocationEmail: e.target.value })} placeholder="contact@business.com" className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Phone</Label>
                    <Input value={form.newLocationPhone} onChange={(e) => setForm({ ...form, newLocationPhone: e.target.value })} placeholder="+1 555 123 4567" className="text-xs" />
                  </div>
                </div>
              )}

              {/* Manual entry */}
              {(form.locationMode === "manual" || !hasAgency) && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Location ID</Label>
                    <Input value={form.ghlLocationId} onChange={(e) => setForm({ ...form, ghlLocationId: e.target.value })} placeholder="e.g. abc123DEFghi..." className="font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>API Token</Label>
                    <div className="relative">
                      <Input
                        type={showToken ? "text" : "password"}
                        value={form.ghlAccessToken}
                        onChange={(e) => setForm({ ...form, ghlAccessToken: e.target.value })}
                        placeholder={editingId ? "Leave blank to keep" : "pit-xxxxx..."}
                        className="font-mono text-xs pr-10"
                      />
                      <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createUser.isPending || updateUser.isPending || createLocation.isPending}>
              {(createUser.isPending || updateUser.isPending || createLocation.isPending) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingId ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────
function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"users" | "settings">("users");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-800">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Signed in as <strong className="text-gray-900 dark:text-white">{session?.user?.name}</strong></span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/admin" })}>
              <LogOut className="h-4 w-4 mr-1.5" />Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex gap-1 px-6">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "users"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Users className="h-4 w-4" />Users
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Settings className="h-4 w-4" />Settings
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {activeTab === "users" ? <UsersTab /> : <SettingsTab />}
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0f172a]">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!session || !isAdmin) return <AdminLogin />;
  return <AdminDashboard />;
}
