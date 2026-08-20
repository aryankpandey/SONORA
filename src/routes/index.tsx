import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CardRow, CardRowSkeleton, Section } from "@/components/music/Section";
import { MediaCard } from "@/components/music/MediaCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useRecentlyPlayed } from "@/hooks/useLibrary";
import {
  fetchAlbums,
  fetchArtists,
  fetchNewReleases,
  fetchQuickPicks,
  fetchSongsByGenre,
  fetchTrendingSongs,
} from "@/lib/catalog";
import { greetingForNow } from "@/lib/format";
import type { Song } from "@/lib/music-types";

function useGreeting() {
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    setGreeting(greetingForNow());
  }, []);
  return greeting;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SONORA — Your sound. Your space." },
      {
        name: "description",
        content:
          "Stream music on SONORA: discover trending tracks, build playlists, save favourites and pick up right where you left off.",
      },
      { property: "og:title", content: "SONORA — Your sound. Your space." },
      {
        property: "og:description",
        content: "Discover, play and collect music in a player built for late nights and long drives.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const player = usePlayer();
  const greeting = useGreeting();

  const trending = useQuery({ queryKey: ["trending"], queryFn: () => fetchTrendingSongs(12) });
  const quickPicks = useQuery({ queryKey: ["quick-picks"], queryFn: () => fetchQuickPicks(8) });
  const newReleases = useQuery({ queryKey: ["new-releases"], queryFn: () => fetchNewReleases(10) });
  const albums = useQuery({ queryKey: ["albums"], queryFn: () => fetchAlbums(12) });
  const artists = useQuery({ queryKey: ["artists"], queryFn: () => fetchArtists(12) });
  const focus = useQuery({ queryKey: ["genre", "Lo-fi"], queryFn: () => fetchSongsByGenre("Lo-fi", 10) });
  const recent = useRecentlyPlayed();

  const playFrom = (songs: Song[] | undefined, index: number) => {
    if (!songs) return;
    player.playQueue(songs, index);
  };

  return (
    <div className="mx-auto max-w-[110rem] space-y-10">
      <section className="surface-card relative overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">SONORA</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {greeting}
            {user ? "" : ", listener"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Your sound. Your space. Press play and let the room fill up.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="rounded-full gradient-ember text-primary-foreground shadow-glow"
              onClick={() => trending.data && player.playQueue(trending.data, 0)}
              disabled={!trending.data?.length}
            >
              Play trending
            </Button>
            {!user ? (
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/auth">Create your library</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {user ? (
        <Section title="Recently played" description="Continue where you stopped">
          {recent.isLoading ? (
            <CardRowSkeleton />
          ) : recent.data && recent.data.length > 0 ? (
            <CardRow>
              {recent.data.map((song, index) => (
                <MediaCard
                  key={song.id}
                  to="/album/$slug"
                  params={song.albums ? { slug: song.albums.slug } : undefined}
                  title={song.title}
                  subtitle={song.artists?.name}
                  image={song.artwork_url}
                  onPlay={() => playFrom(recent.data, index)}
                />
              ))}
            </CardRow>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing here yet — play something and it will show up.
            </p>
          )}
        </Section>
      ) : null}

      <Section title="Quick picks" description="Short on time? Start here.">
        {quickPicks.isLoading ? (
          <CardRowSkeleton />
        ) : (
          <CardRow>
            {(quickPicks.data ?? []).map((song, index) => (
              <MediaCard
                key={song.id}
                to="/album/$slug"
                params={song.albums ? { slug: song.albums.slug } : undefined}
                title={song.title}
                subtitle={song.artists?.name}
                image={song.artwork_url}
                onPlay={() => playFrom(quickPicks.data, index)}
              />
            ))}
          </CardRow>
        )}
      </Section>

      <Section title="Trending now" description="What the room is spinning">
        {trending.isLoading ? (
          <CardRowSkeleton />
        ) : (
          <CardRow>
            {(trending.data ?? []).map((song, index) => (
              <MediaCard
                key={song.id}
                to="/album/$slug"
                params={song.albums ? { slug: song.albums.slug } : undefined}
                title={song.title}
                subtitle={song.artists?.name}
                image={song.artwork_url}
                onPlay={() => playFrom(trending.data, index)}
              />
            ))}
          </CardRow>
        )}
      </Section>

      <Section title="New releases" description="Fresh from the studio">
        {newReleases.isLoading ? (
          <CardRowSkeleton />
        ) : (
          <CardRow>
            {(newReleases.data ?? []).map((album) => (
              <MediaCard
                key={album.id}
                to="/album/$slug"
                params={{ slug: album.slug }}
                title={album.title}
                subtitle={album.artists?.name ?? String(album.release_year ?? "")}
                image={album.artwork_url}
              />
            ))}
          </CardRow>
        )}
      </Section>

      <Section title="Popular albums" description="Records worth playing end to end">
        {albums.isLoading ? (
          <CardRowSkeleton />
        ) : (
          <CardRow>
            {(albums.data ?? []).map((album) => (
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
        )}
      </Section>

      <Section title="Made for you" description="Low tempo, high focus">
        {focus.isLoading ? (
          <CardRowSkeleton />
        ) : (
          <CardRow>
            {(focus.data ?? []).map((song, index) => (
              <MediaCard
                key={song.id}
                to="/album/$slug"
                params={song.albums ? { slug: song.albums.slug } : undefined}
                title={song.title}
                subtitle={song.artists?.name}
                image={song.artwork_url}
                onPlay={() => playFrom(focus.data, index)}
              />
            ))}
          </CardRow>
        )}
      </Section>

      <Section title="Popular artists" description="Voices behind the catalogue">
        {artists.isLoading ? (
          <CardRowSkeleton circle />
        ) : (
          <CardRow>
            {(artists.data ?? []).map((artist) => (
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
        )}
      </Section>
    </div>
  );
}
