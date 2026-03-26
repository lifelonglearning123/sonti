"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAdminUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-admin-users";
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
import { Plus, Pencil, Trash2, Shield, User, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserFormData {
  username: string;
  password: string;
  role: string;
  ghlLocationId: string;
  ghlAccessToken: string;
}

const emptyForm: UserFormData = {
  username: "",
  password: "",
  role: "user",
  ghlLocationId: "",
  ghlAccessToken: "",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useAdminUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showToken, setShowToken] = useState(false);

  if (session?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const users = data?.users || [];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowToken(false);
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
    });
    setShowToken(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const payload: Record<string, string> = {};
        if (form.username) payload.username = form.username;
        if (form.password) payload.password = form.password;
        if (form.role) payload.role = form.role;
        payload.ghlLocationId = form.ghlLocationId;
        payload.ghlAccessToken = form.ghlAccessToken;

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
          ghlLocationId: form.ghlLocationId || undefined,
          ghlAccessToken: form.ghlAccessToken || undefined,
        });
        toast.success("User created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save user");
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage user accounts and their CRM connections.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Location ID</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">API Token</th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                  No users yet. Add one to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {user.ghlLocationId
                        ? `${user.ghlLocationId.substring(0, 8)}...`
                        : <span className="text-gray-300 dark:text-gray-600">Not set</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.hasToken ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingId(user.id); setDeleteDialogOpen(true); }}
                        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete user"
                      >
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>{editingId ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "user" })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                    form.role === "user"
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <User className="h-4 w-4 inline mr-1.5" />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "admin" })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                    form.role === "admin"
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Shield className="h-4 w-4 inline mr-1.5" />
                  Admin
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                CRM Connection
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Location ID</Label>
                  <Input
                    value={form.ghlLocationId}
                    onChange={(e) => setForm({ ...form, ghlLocationId: e.target.value })}
                    placeholder="e.g. abc123DEFghi..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={form.ghlAccessToken}
                      onChange={(e) => setForm({ ...form, ghlAccessToken: e.target.value })}
                      placeholder={editingId ? "Leave blank to keep current" : "pit-xxxxx..."}
                      className="font-mono text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createUser.isPending || updateUser.isPending}
            >
              {(createUser.isPending || updateUser.isPending) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingId ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
