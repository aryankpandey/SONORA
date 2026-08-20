import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SONORA" },
      { name: "description", content: "Sign in or create a free SONORA account to save songs, build playlists and keep your listening history." },
      { property: "og:title", content: "Sign in — SONORA" },
      { property: "og:description", content: "Create your SONORA library in seconds." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back.");
      void navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(friendlyError(error, "We couldn't sign you in."));
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Please choose a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, displayName.trim() || "Listener");
      if (needsConfirmation) {
        toast.success("Check your inbox to confirm your email.");
      } else {
        toast.success("Your library is ready.");
        void navigate({ to: "/", replace: true });
      }
    } catch (error) {
      toast.error(friendlyError(error, "We couldn't create that account."));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(friendlyError(error, "Google sign-in didn't complete."));
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first, then request a reset link.");
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      toast.success("Password reset link sent.");
    } catch (error) {
      toast.error(friendlyError(error, "We couldn't send that reset link."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-ember text-primary-foreground shadow-glow">
            <ListMusic className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight">SONORA</span>
        </Link>

        <div className="surface-card p-6">
          <h1 className="text-center text-xl font-bold">Your sound. Your space.</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Sign in to save songs, build playlists and keep your history.
          </p>

          <Button variant="secondary" className="mt-6 w-full rounded-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-4 pt-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 pt-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display name</Label>
                  <Input
                    id="signup-name"
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Aryan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Keep browsing without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
