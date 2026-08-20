import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";

import { MediaCard } from "@/components/music/MediaCard";
import { CardRow, CardRowSkeleton, EmptyState, Section } from "@/components/music/Section";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useFollowedArtists, usePlaylists, useRecentlyPlayed, useSavedAlbums } from "@/hooks/useLibrary";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Your library — SONORA" },
      { name: "description", content: "Your playlists, saved albums, followed artists and recent plays in one place." },
      { property: "og:title", content: "Your library — SONORA" },
      { property: "og:description", content: "Everything you've collected on SONORA." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useAuth();
  const playlists = usePlaylists();
  const albums = useSavedAlbums();
  const artists = useFollowedArtists();
  const recent = useRecentlyPlayed();

  if (!user) {
    return (
      <EmptyState
        title="Your library lives here"
        description="Sign in to save albums, follow artists and build playlists."
        action={
          <Button asChild className="mt-2 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-[110rem] space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Your library</h1>
        <CreatePlaylistDialog
          trigger={
            <Button className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden /> New playlist
            </Button>
          }
        />
      </div>

      <Section title="Playlists">
        {playlists.isLoading ? (
          <CardRowSkeleton />
        ) : playlists.data && playlists.data.length > 0 ? (
          <CardRow>
            <Link
              to="/liked"
              className="group flex w-40 shrink-0 flex-col gap-3 rounded-xl p-2 transition-colors hover:bg-surface-raised sm:w-44"
            >
              <span className="flex aspect-square items-center justify-center rounded-lg gradient-ember">
                <Heart className="h-10 w-10 fill-current text-primary-foreground" aria-hidden />
              </span>
              <span className="truncate text-sm font-semibold">Liked Songs</span>
            </Link>
            {playlists.data.map((playlist) => (
              <MediaCard
                key={playlist.id}
                to="/playlist/$id"
                params={{ id: playlist.id }}
                title={playlist.name}
                subtitle={playlist.description ?? "Playlist"}
                image={playlist.cover_url}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted-foreground">No playlists yet — create your first one above.</p>
        )}
      </Section>

      <Section title="Saved albums">
        {albums.isLoading ? (
          <CardRowSkeleton />
        ) : albums.data && albums.data.length > 0 ? (
          <CardRow>
            {albums.data.map((album) => (
              <MediaCard
                key={album.id}
                to="/album/$slug"
                params={{ slug: album.slug }}
                title={album.title}
                subtitle={album.artists?.name}
                image={album.artwork_url}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted-foreground">Save an album and it will appear here.</p>
        )}
      </Section>

      <Section title="Following">
        {artists.isLoading ? (
          <CardRowSkeleton circle />
        ) : artists.data && artists.data.length > 0 ? (
          <CardRow>
            {artists.data.map((artist) => (
              <MediaCard
                key={artist.id}
                to="/artist/$slug"
                params={{ slug: artist.slug }}
                title={artist.name}
                subtitle="Artist"
                image={artist.image_url}
                circle
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted-foreground">Follow artists to keep up with their releases.</p>
        )}
      </Section>

      <Section title="Recently played">
        {recent.isLoading ? (
          <CardRowSkeleton />
        ) : recent.data && recent.data.length > 0 ? (
          <CardRow>
            {recent.data.map((song) => (
              <MediaCard
                key={song.id}
                to="/album/$slug"
                params={song.albums ? { slug: song.albums.slug } : undefined}
                title={song.title}
                subtitle={song.artists?.name}
                image={song.artwork_url}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing played yet.</p>
        )}
      </Section>
    </div>
  );
}
