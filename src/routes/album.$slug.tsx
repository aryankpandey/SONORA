import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Play } from "lucide-react";

import { Artwork } from "@/components/music/Artwork";
import { EmptyState } from "@/components/music/Section";
import { SongList } from "@/components/music/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSavedAlbums, useToggleSavedAlbum } from "@/hooks/useLibrary";
import { fetchAlbumBySlug } from "@/lib/catalog";
import { formatTotalDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/album/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Album — SONORA` },
      { name: "description", content: `Listen to the album ${params.slug.replace(/-/g, " ")} on SONORA.` },
      { property: "og:title", content: "Album — SONORA" },
      { property: "og:description", content: "Play this album end to end on SONORA." },
    ],
  }),
  component: AlbumPage,
});

function AlbumPage() {
  const { slug } = Route.useParams();
  const player = usePlayer();
  const { user } = useAuth();
  const saved = useSavedAlbums();
  const toggleSaved = useToggleSavedAlbum();

  const query = useQuery({ queryKey: ["album", slug], queryFn: () => fetchAlbumBySlug(slug) });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-[80rem] space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <Skeleton className="h-52 w-52 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="We couldn't find that album."
        description="It may have been removed from the catalogue."
        action={
          <Button asChild className="mt-2">
            <Link to="/">Back home</Link>
          </Button>
        }
      />
    );
  }

  const { album, songs } = query.data;
  const isSaved = (saved.data ?? []).some((item) => item.id === album.id);
  const total = songs.reduce((sum, song) => sum + (song.duration ?? 0), 0);

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Artwork src={album.artwork_url} alt={album.title} className="h-52 w-52 shrink-0 shadow-glow" rounded="lg" />
        <div className="min-w-0 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Album</p>
          <h1 className="text-3xl font-bold sm:text-5xl">{album.title}</h1>
          <p className="text-sm text-muted-foreground">
            {album.artists ? (
              <Link to="/artist/$slug" params={{ slug: album.artists.slug }} className="font-medium text-foreground hover:underline">
                {album.artists.name}
              </Link>
            ) : null}
            {album.release_year ? ` · ${album.release_year}` : ""} · {songs.length} songs · {formatTotalDuration(total)}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
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
              onClick={() => toggleSaved.mutate({ albumId: album.id, saved: !isSaved })}
              disabled={!user}
              aria-pressed={isSaved}
            >
              <Heart className={cn("mr-1.5 h-4 w-4", isSaved && "fill-primary text-primary")} aria-hidden />
              {isSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      {songs.length > 0 ? (
        <SongList songs={songs} onPlayIndex={(index) => player.playQueue(songs, index)} showAlbum={false} />
      ) : (
        <EmptyState title="No tracks yet" description="This album has no songs in the catalogue." />
      )}
    </div>
  );
}
