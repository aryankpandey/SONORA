import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ListMusic, Pencil, Play, Shuffle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/music/Section";
import { SongList } from "@/components/music/SongRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatTotalDuration, friendlyError } from "@/lib/format";
import { deletePlaylist, fetchPlaylist, removeSongFromPlaylist, updatePlaylist } from "@/lib/library";

export const Route = createFileRoute("/playlist/$id")({
  head: () => ({
    meta: [
      { title: "Playlist — SONORA" },
      { name: "description", content: "Play, edit and manage the tracks in your SONORA playlist." },
      { property: "og:title", content: "Playlist — SONORA" },
      { property: "og:description", content: "A playlist built on SONORA." },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const player = usePlayer();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const query = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetchPlaylist(id),
    enabled: Boolean(user),
  });

  const save = useMutation({
    mutationFn: () => updatePlaylist(id, { name: name.trim(), description: description.trim() || null }),
    onSuccess: () => {
      toast.success("Playlist updated.");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't update that playlist.")),
  });

  const remove = useMutation({
    mutationFn: () => deletePlaylist(id),
    onSuccess: () => {
      toast.success("Playlist deleted.");
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
      void navigate({ to: "/library", replace: true });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't delete that playlist.")),
  });

  const removeSong = useMutation({
    mutationFn: (songId: string) => removeSongFromPlaylist(id, songId),
    onSuccess: () => {
      toast.success("Removed from playlist.");
      void queryClient.invalidateQueries({ queryKey: ["playlist", id] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't remove that song.")),
  });

  if (!user) {
    return (
      <EmptyState
        title="Sign in to open this playlist"
        description="Playlists are private to your account."
        action={
          <Button asChild className="mt-2 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-[80rem] space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="We couldn't find that playlist."
        description="It may have been deleted."
        action={
          <Button asChild className="mt-2 rounded-full">
            <Link to="/library">Back to library</Link>
          </Button>
        }
      />
    );
  }

  const { playlist, songs } = query.data;
  const total = songs.reduce((sum, song) => sum + (song.duration ?? 0), 0);

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <header className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-surface-raised shadow-glow">
          <ListMusic className="h-14 w-14 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Playlist</p>
          <h1 className="truncate text-3xl font-bold sm:text-5xl">{playlist.name}</h1>
          {playlist.description ? <p className="text-sm text-muted-foreground">{playlist.description}</p> : null}
          <p className="text-sm text-muted-foreground">
            {songs.length} songs · {formatTotalDuration(total)}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="lg"
              className="rounded-full gradient-ember text-primary-foreground shadow-glow"
              onClick={() => player.playQueue(songs, 0)}
              disabled={songs.length === 0}
            >
              <Play className="mr-1.5 h-4 w-4 fill-current" aria-hidden /> Play
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full"
              onClick={() => player.playQueue(songs, 0, { shuffle: true })}
              disabled={songs.length === 0}
            >
              <Shuffle className="mr-1.5 h-4 w-4" aria-hidden /> Shuffle
            </Button>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit playlist"
                  onClick={() => {
                    setName(playlist.name);
                    setDescription(playlist.description ?? "");
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playlist-name">Name</Label>
                    <Input id="playlist-name" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="playlist-description">Description</Label>
                    <Textarea
                      id="playlist-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete playlist">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{playlist.name}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the playlist and its track order. Your liked songs stay untouched.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {songs.length === 0 ? (
        <EmptyState
          title="This playlist is empty"
          description="Use the “…” menu on any song to add it here."
          action={
            <Button asChild variant="secondary" className="mt-2 rounded-full">
              <Link to="/search">Find songs</Link>
            </Button>
          }
        />
      ) : (
        <SongList
          songs={songs}
          onPlayIndex={(index) => player.playQueue(songs, index)}
          onRemove={(song) => removeSong.mutate(song.id)}
          removeLabel="Remove from this playlist"
        />
      )}
    </div>
  );
}
