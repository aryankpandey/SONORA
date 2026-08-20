import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/music/Section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useFollowedArtists, usePlaylists, useSavedAlbums } from "@/hooks/useLibrary";
import { friendlyError } from "@/lib/format";
import { fetchProfile, updateProfile } from "@/lib/library";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SONORA" },
      { name: "description", content: "Update your SONORA display name and bio, and review your listening stats." },
      { property: "og:title", content: "Your profile — SONORA" },
      { property: "og:description", content: "Manage your SONORA account." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playlists = usePlaylists();
  const albums = useSavedAlbums();
  const artists = useFollowedArtists();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name ?? "");
      setBio(profile.data.bio ?? "");
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => updateProfile(user!.id, { display_name: displayName.trim(), bio: bio.trim() || null }),
    onSuccess: () => {
      toast.success("Profile saved.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't save your profile.")),
  });

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view your profile"
        description="Your display name, bio and stats live here."
        action={
          <Button asChild className="mt-2 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        }
      />
    );
  }

  const stats = [
    { label: "Playlists", value: playlists.data?.length ?? 0 },
    { label: "Saved albums", value: albums.data?.length ?? 0 },
    { label: "Following", value: artists.data?.length ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="surface-card flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarFallback className="bg-surface-raised text-2xl font-semibold">
            {(displayName || user.email || "S").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{displayName || "Listener"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card p-4 text-center">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <form
        className="surface-card space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="text-lg font-semibold">Account details</h2>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Display name</Label>
          <Input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-bio">Bio</Label>
          <Textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={3} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="rounded-full" disabled={save.isPending}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await signOut();
              void navigate({ to: "/auth", replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </form>
    </div>
  );
}
