import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Play, Shuffle } from "lucide-react";

import { EmptyState } from "@/components/music/Section";
import { SongList } from "@/components/music/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatTotalDuration } from "@/lib/format";
import { fetchLikedSongs } from "@/lib/library";

export const Route = createFileRoute("/liked")({
  head: () => ({
    meta: [
      { title: "Liked Songs — SONORA" },
      { name: "description", content: "Every track you've hearted on SONORA, ready to play in one tap." },
      { property: "og:title", content: "Liked Songs — SONORA" },
      { property: "og:description", content: "Your personal collection of favourite tracks on SONORA." },
    ],
  }),
  component: LikedPage,
});

function LikedPage() {
  const { user } = useAuth();
  const player = usePlayer();
  const query = useQuery({
    queryKey: ["liked-songs", user?.id],
    queryFn: fetchLikedSongs,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your Liked Songs"
        description="Heart any track and it lands here instantly."
        action={
          <Button asChild className="mt-2 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        }
      />
    );
  }

  const songs = query.data ?? [];
  const total = songs.reduce((sum, song) => sum + (song.duration ?? 0), 0);

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <header className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl gradient-ember shadow-glow">
          <Heart className="h-16 w-16 fill-current text-primary-foreground" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Playlist</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Liked Songs</h1>
          <p className="text-sm text-muted-foreground">
            {songs.length} songs · {formatTotalDuration(total)}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
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
          </div>
        </div>
      </header>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <EmptyState
          title="No liked songs yet"
          description="Tap the heart on any track to start your collection."
          action={
            <Button asChild variant="secondary" className="mt-2 rounded-full">
              <Link to="/">Discover music</Link>
            </Button>
          }
        />
      ) : (
        <SongList songs={songs} onPlayIndex={(index) => player.playQueue(songs, index)} />
      )}
    </div>
  );
}
