import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, UserPlus } from "lucide-react";

import { Artwork } from "@/components/music/Artwork";
import { MediaCard } from "@/components/music/MediaCard";
import { CardRow, EmptyState, Section } from "@/components/music/Section";
import { SongList } from "@/components/music/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useFollowedArtists, useToggleFollowArtist } from "@/hooks/useLibrary";
import { fetchArtistBySlug } from "@/lib/catalog";

export const Route = createFileRoute("/artist/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "Artist — SONORA" },
      { name: "description", content: `Explore top songs and albums from ${params.slug.replace(/-/g, " ")} on SONORA.` },
      { property: "og:title", content: "Artist — SONORA" },
      { property: "og:description", content: "Top tracks, albums and related artists on SONORA." },
    ],
  }),
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const player = usePlayer();
  const { user } = useAuth();
  const followed = useFollowedArtists();
  const toggleFollow = useToggleFollowArtist();

  const query = useQuery({ queryKey: ["artist", slug], queryFn: () => fetchArtistBySlug(slug) });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-[80rem] space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="We couldn't find that artist."
        description="They may no longer be in the catalogue."
        action={
          <Button asChild className="mt-2">
            <Link to="/">Back home</Link>
          </Button>
        }
      />
    );
  }

  const { artist, popular, albums, related } = query.data;
  const isFollowing = (followed.data ?? []).some((item) => item.id === artist.id);

  return (
    <div className="mx-auto max-w-[80rem] space-y-10">
      <header className="surface-card relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-10">
          <Artwork
            src={artist.image_url}
            alt={artist.name}
            className="h-40 w-40 shrink-0 shadow-glow"
            rounded="full"
          />
          <div className="min-w-0 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Artist</p>
            <h1 className="text-3xl font-bold sm:text-5xl">{artist.name}</h1>
            {artist.bio ? <p className="max-w-2xl text-sm text-muted-foreground">{artist.bio}</p> : null}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="lg"
                className="rounded-full gradient-ember text-primary-foreground shadow-glow"
                onClick={() => player.playQueue(popular, 0)}
                disabled={popular.length === 0}
              >
                <Play className="mr-1.5 h-4 w-4 fill-current" aria-hidden /> Play
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full"
                onClick={() => toggleFollow.mutate({ artistId: artist.id, followed: !isFollowing })}
                disabled={!user}
                aria-pressed={isFollowing}
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Section title="Popular">
        {popular.length > 0 ? (
          <SongList songs={popular} onPlayIndex={(index) => player.playQueue(popular, index)} />
        ) : (
          <p className="text-sm text-muted-foreground">No tracks yet.</p>
        )}
      </Section>

      {albums.length > 0 ? (
        <Section title="Albums">
          <CardRow>
            {albums.map((album) => (
              <MediaCard
                key={album.id}
                to="/album/$slug"
                params={{ slug: album.slug }}
                title={album.title}
                subtitle={album.release_year ? String(album.release_year) : "Album"}
                image={album.artwork_url}
              />
            ))}
          </CardRow>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section title="Fans also like">
          <CardRow>
            {related.map((other) => (
              <MediaCard
                key={other.id}
                to="/artist/$slug"
                params={{ slug: other.slug }}
                title={other.name}
                subtitle="Artist"
                image={other.image_url}
                circle
              />
            ))}
          </CardRow>
        </Section>
      ) : null}
    </div>
  );
}
