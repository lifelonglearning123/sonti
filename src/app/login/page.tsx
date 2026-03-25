"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Workflow, Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GHL_AUTH_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [locationId, setLocationId] = useState("");

  const code = searchParams.get("code");

  // If we have a code from GHL callback, exchange it for tokens
  useEffect(() => {
    if (code) {
      setIsConnecting(true);
      signIn("ghl-token", {
        code,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          router.push("/contacts");
        } else {
          setError("Failed to connect via OAuth. Try using a Private Integration Token instead.");
          setIsConnecting(false);
        }
      });
    }
  }, [code, router]);

  const handleOAuthConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GHL_APP_ID || "69c2843a5ad2e9706c84fa38";
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/ghl`);
    const scope = encodeURIComponent(
      "contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write calendars/events.readonly calendars/events.write locations.readonly"
    );
    window.location.href = `${GHL_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleTokenConnect = async () => {
    if (!token || !locationId) {
      setError("Please enter both your token and location ID");
      return;
    }
    setIsConnecting(true);
    setError("");

    const result = await signIn("ghl-token", {
      accessToken: token,
      locationId,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/contacts");
    } else {
      setError("Invalid token or location ID. Please check and try again.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6">
            <Workflow className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PipeFlow</h1>
          <p className="text-gray-500">
            A better way to manage your contacts, deals, and calendar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {isConnecting ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Connecting your account...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Tabs defaultValue="token" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="token" className="flex-1">Private Token</TabsTrigger>
                  <TabsTrigger value="oauth" className="flex-1">OAuth</TabsTrigger>
                </TabsList>

                <TabsContent value="token">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter your GHL Private Integration Token and Location ID
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="locationId">Location ID</Label>
                      <Input
                        id="locationId"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        placeholder="e.g. abc123DEFghi..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token">Private Integration Token</Label>
                      <Input
                        id="token"
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="pit-xxxxx..."
                      />
                    </div>
                    <Button onClick={handleTokenConnect} className="w-full h-11">
                      <Key className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Find these in GHL &rarr; Settings &rarr; Integrations &rarr; Private Integrations
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="oauth">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Connect via GoHighLevel OAuth (requires approved marketplace app)
                    </p>
                    <Button
                      onClick={handleOAuthConnect}
                      className="w-full h-11"
                    >
                      Connect with GoHighLevel
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-gray-400 text-center mt-6">
                Your data stays in GoHighLevel. PipeFlow provides a better interface.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
