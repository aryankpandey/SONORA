import { Link } from "@tanstack/react-router";
import {
  ChevronUp,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { Artwork } from "@/components/music/Artwork";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useLikedSongIds, useToggleLike } from "@/hooks/useLibrary";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

function QueuePanel() {
  const { queue, index, playQueue } = usePlayer();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open queue" className="h-9 w-9">
          <ListMusic className="h-4.5 w-4.5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto bg-surface">
        <SheetHeader>
          <SheetTitle>Up next</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing queued yet.</p>
          ) : (
            queue.map((song, i) => (
              <button
                key={`${song.id}-${i}`}
                type="button"
                onClick={() => playQueue(queue, i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-raised",
                  i === index && "bg-surface-raised",
                )}
              >
                <div className="h-10 w-10 shrink-0">
                  <Artwork src={song.artwork_url} alt={song.title} rounded="md" />
                </div>
                <div className="min-w-0">
                  <p className={cn("truncate text-sm", i === index && "text-primary")}>{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{song.artists?.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PlayerBar() {
  const player = usePlayer();
  const { user } = useAuth();
  const likedIds = useLikedSongIds();
  const toggleLike = useToggleLike();
  const song = player.current;
  const liked = song ? likedIds.has(song.id) : false;

  const handleLike = () => {
    if (!song) return;
    if (!user) {
      toast("Sign in to save songs to your library.");
      return;
    }
    toggleLike.mutate({ songId: song.id, liked: !liked });
  };

  const RepeatIcon = player.repeat === "one" ? Repeat1 : Repeat;
  const VolumeIcon = player.muted || player.volume === 0 ? VolumeX : player.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="glass-panel fixed inset-x-0 bottom-[3.75rem] z-40 border-x-0 border-b-0 px-3 py-2 lg:bottom-0 lg:px-4 lg:py-3">
      <div className="mx-auto flex max-w-[110rem] items-center gap-3">
        {/* Track identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-72 lg:flex-none">
          <button
            type="button"
            onClick={() => song && player.setExpanded(true)}
            className="h-12 w-12 shrink-0 overflow-hidden rounded-lg lg:cursor-default"
            aria-label="Open now playing"
          >
            <Artwork src={song?.artwork_url} alt={song?.title ?? "Nothing playing"} rounded="md" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{song?.title ?? "Nothing playing"}</p>
            {song?.artists ? (
              <Link
                to="/artist/$slug"
                params={{ slug: song.artists.slug }}
                className="truncate text-xs text-muted-foreground hover:underline"
              >
                {song.artists.name}
              </Link>
            ) : (
              <p className="truncate text-xs text-muted-foreground">Pick a track to start listening</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={!song}
            aria-pressed={liked}
            aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
            className="hidden h-9 w-9 lg:inline-flex"
          >
            <Heart className={cn("h-4.5 w-4.5", liked && "fill-primary text-primary")} aria-hidden />
          </Button>
        </div>

        {/* Transport */}
        <div className="flex flex-none items-center gap-1 lg:flex-1 lg:flex-col lg:gap-1.5">
          <div className="flex items-center gap-1 lg:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.toggleShuffle}
              aria-pressed={player.shuffle}
              aria-label="Shuffle"
              className={cn("hidden h-9 w-9 lg:inline-flex", player.shuffle && "text-primary")}
            >
              <Shuffle className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={player.previous}
              disabled={!song}
              aria-label="Previous track"
              className="h-9 w-9"
            >
              <SkipBack className="h-5 w-5 fill-current" aria-hidden />
            </Button>
            <Button
              onClick={player.toggle}
              disabled={!song}
              aria-label={player.isPlaying ? "Pause" : "Play"}
              className="h-11 w-11 rounded-full gradient-ember p-0 text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              {player.isPlaying ? (
                <Pause className="h-5 w-5 fill-current" aria-hidden />
              ) : (
                <Play className="h-5 w-5 fill-current" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={player.next}
              disabled={!song}
              aria-label="Next track"
              className="h-9 w-9"
            >
              <SkipForward className="h-5 w-5 fill-current" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={player.cycleRepeat}
              aria-label={`Repeat: ${player.repeat}`}
              className={cn("hidden h-9 w-9 lg:inline-flex", player.repeat !== "off" && "text-primary")}
            >
              <RepeatIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div className="hidden w-full max-w-xl items-center gap-2 lg:flex">
            <span className="w-10 text-right text-[0.7rem] tabular-nums text-muted-foreground">
              {formatDuration(player.progress)}
            </span>
            <Slider
              value={[player.progress]}
              max={Math.max(player.duration, 1)}
              step={1}
              onValueChange={([value]) => player.seek(value ?? 0)}
              aria-label="Seek"
              className="flex-1"
              disabled={!song}
            />
            <span className="w-10 text-[0.7rem] tabular-nums text-muted-foreground">
              {formatDuration(player.duration)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="hidden flex-none items-center justify-end gap-2 lg:flex lg:w-72">
          <QueuePanel />
          <Button variant="ghost" size="icon" onClick={player.toggleMute} aria-label="Mute" className="h-9 w-9">
            <VolumeIcon className="h-4.5 w-4.5" aria-hidden />
          </Button>
          <Slider
            value={[player.muted ? 0 : player.volume]}
            max={1}
            step={0.01}
            onValueChange={([value]) => player.setVolume(value ?? 0)}
            aria-label="Volume"
            className="w-28"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => player.setExpanded(true)}
          disabled={!song}
          aria-label="Open now playing"
          className="h-9 w-9 lg:hidden"
        >
          <ChevronUp className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      {/* Mobile progress line */}
      <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted lg:hidden">
        <div
          className="h-full gradient-ember transition-[width] duration-300"
          style={{ width: `${player.duration ? (player.progress / player.duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
