"use client";

import { useSession, signOut } from "next-auth/react";
import {
  Building2,
  Key,
  Palette,
  Info,
  LogOut,
  ExternalLink,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import { Workflow } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const [copied, setCopied] = useState(false);

  const maskedLocationId = locationId
    ? `${locationId.slice(0, 6)}${"*".repeat(Math.max(0, locationId.length - 10))}${locationId.slice(-4)}`
    : "Not connected";

  const handleCopyLocationId = () => {
    if (locationId) {
      navigator.clipboard.writeText(locationId);
      setCopied(true);
      toast.success("Location ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and application preferences.
        </p>
      </div>

      {/* Account */}
      <Card className="border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Building2 className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Account</h3>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Location Name</p>
              <p className="text-sm text-gray-500">
                {session?.user?.name || "GoHighLevel Location"}
              </p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-500">
                {session?.user?.email || "Not set"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Location ID</p>
              <p className="text-sm text-gray-500 font-mono">{maskedLocationId}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLocationId}>
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Management */}
      <Card className="border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Key className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            API Connection
          </h3>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  GoHighLevel API
                </p>
                <p className="text-xs text-gray-500">
                  Connected via {locationId ? "Private Integration" : "OAuth"}
                </p>
              </div>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              To disconnect, sign out of your account.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card className="border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Palette className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Appearance</h3>
        </div>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-500">
                Light mode is the current default.
              </p>
            </div>
            <Badge variant="outline">Light</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Dark mode and custom themes coming soon.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Info className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">About</h3>
        </div>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8553A] to-[#D4442B] shadow-sm">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Sonti</p>
              <p className="text-xs text-gray-500">Version 0.1.0</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            A modern CRM interface built on top of the GoHighLevel API.
            Manage contacts, deals, conversations, and appointments all in one
            place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
