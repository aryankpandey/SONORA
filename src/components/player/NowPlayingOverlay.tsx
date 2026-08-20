import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";

import { Artwork } from "@/components/music/Artwork";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongIds, useToggleLike } from "@/hooks/useLibrary";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Full-screen Now Playing view; the artwork drives the background wash. */
export function NowPlayingOverlay() {
  const player = usePlayer();
  const { user } = useAuth();
  const likedIds = useLikedSongIds();
  const toggleLike = useToggleLike();
  const song = player.current;

  if (!player.expanded || !song) return null;

  const liked = likedIds.has(song.id);
  const RepeatIcon = player.repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95">
      {song.artwork_url ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-3xl"
          style={{ backgroundImage: `url(${song.artwork_url})` }}
        />
      ) : null}

      <div className="relative flex items-center justify-between px-5 py-4">
        <Button variant="ghost" size="icon" onClick={() => player.setExpanded(false)} aria-label="Close now playing">
          <ChevronDown className="h-5 w-5" aria-hidden />
        </Button>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Now playing</p>
        <span className="w-9" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 pb-10">
        <div className="aspect-square w-full overflow-hidden rounded-3xl shadow-lift">
          <Artwork src={song.artwork_url} alt={song.title} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{song.title}</h1>
            <p className="truncate text-sm text-muted-foreground">{song.artists?.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!user) {
                toast("Sign in to save songs to your library.");
                return;
              }
              toggleLike.mutate({ songId: song.id, liked: !liked });
            }}
            aria-pressed={liked}
            aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
          >
            <Heart className={cn("h-6 w-6", liked && "fill-primary text-primary")} aria-hidden />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Slider
            value={[player.progress]}
            max={Math.max(player.duration, 1)}
            step={1}
            onValueChange={([value]) => player.seek(value ?? 0)}
            aria-label="Seek"
          />
          <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatDuration(player.progress)}</span>
            <span>{formatDuration(player.duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={player.toggleShuffle}
            aria-pressed={player.shuffle}
            aria-label="Shuffle"
            className={cn(player.shuffle && "text-primary")}
          >
            <Shuffle className="h-5 w-5" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={player.previous} aria-label="Previous track">
            <SkipBack className="h-7 w-7 fill-current" aria-hidden />
          </Button>
          <Button
            onClick={player.toggle}
            aria-label={player.isPlaying ? "Pause" : "Play"}
            className="h-16 w-16 rounded-full gradient-ember p-0 text-primary-foreground shadow-glow"
          >
            {player.isPlaying ? (
              <Pause className="h-7 w-7 fill-current" aria-hidden />
            ) : (
              <Play className="h-7 w-7 fill-current" aria-hidden />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={player.next} aria-label="Next track">
            <SkipForward className="h-7 w-7 fill-current" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={player.cycleRepeat}
            aria-label={`Repeat: ${player.repeat}`}
            className={cn(player.repeat !== "off" && "text-primary")}
          >
            <RepeatIcon className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <div className="surface-card p-4 text-sm text-muted-foreground">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground">Lyrics</p>
          <p>Lyrics for this track aren&apos;t available yet. Close your eyes instead.</p>
        </div>
      </div>
    </div>
  );
}
