import { Link } from "@tanstack/react-router";
import { Heart, ListPlus, MoreHorizontal, Pause, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Artwork } from "./Artwork";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useAddToPlaylist, useLikedSongIds, usePlaylists, useToggleLike } from "@/hooks/useLibrary";
import { formatDuration } from "@/lib/format";
import type { Song } from "@/lib/music-types";
import { cn } from "@/lib/utils";

interface SongRowProps {
  song: Song;
  position?: number | undefined;
  onPlay: () => void;
  onRemove?: (() => void) | undefined;
  removeLabel?: string | undefined;
  showAlbum?: boolean | undefined;
}

export function SongRow({ song, position, onPlay, onRemove, removeLabel, showAlbum = true }: SongRowProps) {
  const { current, isPlaying, toggle, addToQueue } = usePlayer();
  const { user } = useAuth();
  const likedIds = useLikedSongIds();
  const toggleLike = useToggleLike();
  const addToPlaylist = useAddToPlaylist();
  const { data: playlists } = usePlaylists();

  const isActive = current?.id === song.id;
  const liked = likedIds.has(song.id);

  const handleLike = () => {
    if (!user) {
      toast("Sign in to save songs to your library.");
      return;
    }
    toggleLike.mutate({ songId: song.id, liked: !liked });
  };

  return (
    <div
      className={cn(
        "group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface sm:grid-cols-[2rem_minmax(0,3fr)_minmax(0,2fr)_auto] sm:gap-4 sm:px-3",
        isActive && "bg-surface",
      )}
    >
      <button
        type="button"
        onClick={isActive ? toggle : onPlay}
        aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {isActive && isPlaying ? (
          <Pause className="h-4 w-4 fill-current text-primary" aria-hidden />
        ) : (
          <>
            <span className="tabular-nums group-hover:hidden">{position ?? "-"}</span>
            <Play className="hidden h-4 w-4 fill-current group-hover:block" aria-hidden />
          </>
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <div className="h-10 w-10 shrink-0">
          <Artwork src={song.artwork_url} alt={song.title} rounded="md" />
        </div>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", isActive && "text-primary")}>{song.title}</p>
          {song.artists ? (
            <Link
              to="/artist/$slug"
              params={{ slug: song.artists.slug }}
              className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {song.artists.name}
            </Link>
          ) : null}
        </div>
      </div>

      {showAlbum ? (
        <div className="hidden min-w-0 sm:block">
          {song.albums ? (
            <Link
              to="/album/$slug"
              params={{ slug: song.albums.slug }}
              className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {song.albums.title}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="hidden sm:block" />
      )}

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${song.title} from Liked Songs` : `Add ${song.title} to Liked Songs`}
          className="h-8 w-8"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform",
              liked ? "scale-110 fill-primary text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          />
        </Button>
        <span className="hidden w-12 text-right text-xs tabular-nums text-muted-foreground sm:inline">
          {formatDuration(song.duration)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`More options for ${song.title}`}>
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => addToQueue(song)}>
              <ListPlus className="mr-2 h-4 w-4" aria-hidden /> Add to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
            {!user ? (
              <DropdownMenuItem disabled>Sign in to use playlists</DropdownMenuItem>
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <DropdownMenuItem
                  key={playlist.id}
                  onSelect={() => addToPlaylist.mutate({ playlistId: playlist.id, songId: song.id })}
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden /> {playlist.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
            )}
            {onRemove ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden /> {removeLabel ?? "Remove"}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function SongList({
  songs,
  onPlayIndex,
  onRemove,
  removeLabel,
  showAlbum = true,
}: {
  songs: Song[];
  onPlayIndex: (index: number) => void;
  onRemove?: ((song: Song) => void) | undefined;
  removeLabel?: string | undefined;
  showAlbum?: boolean | undefined;
}) {
  return (
    <div className="space-y-0.5">
      {songs.map((song, index) => (
        <SongRow
          key={song.id}
          song={song}
          position={index + 1}
          showAlbum={showAlbum}
          onPlay={() => onPlayIndex(index)}
          onRemove={onRemove ? () => onRemove(song) : undefined}
          removeLabel={removeLabel}
        />
      ))}
    </div>
  );
}
