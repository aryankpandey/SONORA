import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { MediaCard } from "@/components/music/MediaCard";
import { CardRow, EmptyState, Section } from "@/components/music/Section";
import { SongList } from "@/components/music/SongRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/context/PlayerContext";
import { searchCatalog } from "@/lib/catalog";

const RECENT_KEY = "sonora.recent-searches";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Search music — SONORA" },
      { name: "description", content: "Search songs, albums and artists across the SONORA catalogue in real time." },
      { property: "og:title", content: "Search music — SONORA" },
      { property: "og:description", content: "Find any song, album or artist on SONORA as you type." },
    ],
  }),
  component: SearchPage,
});

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const player = usePlayer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState(q ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const debounced = useDebounced(term.trim());

  useEffect(() => {
    setTerm(q ?? "");
  }, [q]);

  useEffect(() => {
    const stored = window.localStorage.getItem(RECENT_KEY);
    if (stored) setRecent(JSON.parse(stored) as string[]);
  }, []);

  useEffect(() => {
    if (debounced.length < 2) return;
    setRecent((previous) => {
      const next = [debounced, ...previous.filter((item) => item !== debounced)].slice(0, 6);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
    void navigate({ to: "/search", search: { q: debounced }, replace: true });
  }, [debounced, navigate]);

  const results = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchCatalog(debounced),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const isEmpty = useMemo(
    () =>
      results.data &&
      results.data.songs.length === 0 &&
      results.data.albums.length === 0 &&
      results.data.artists.length === 0,
    [results.data],
  );

  return (
    <div className="mx-auto max-w-[110rem] space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Search</h1>
        <div className="relative max-w-2xl">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="search-input" className="sr-only">
            Search songs, albums and artists
          </label>
          <Input
            id="search-input"
            ref={inputRef}
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Songs, albums, artists…"
            className="h-12 rounded-full bg-surface pl-11 pr-11 text-base"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
                void navigate({ to: "/search", search: {}, replace: true });
              }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4.5 w-4.5" aria-hidden />
            </button>
          ) : null}
        </div>

        {recent.length > 0 && debounced.length < 2 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Recent</span>
            {recent.map((item) => (
              <Button key={item} variant="secondary" size="sm" className="rounded-full" onClick={() => setTerm(item)}>
                {item}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {debounced.length < 2 ? (
        <EmptyState title="Start typing to explore" description="Search across every song, album and artist on SONORA." />
      ) : results.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : results.isError ? (
        <EmptyState
          title="Search hit a snag"
          description="We couldn't reach the catalogue just now."
          action={
            <Button onClick={() => void results.refetch()} className="mt-2">
              Retry
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState title="No sounds found." description={`Nothing matched “${debounced}”. Try another spelling.`} />
      ) : (
        <div className="space-y-10">
          {results.data && results.data.songs.length > 0 ? (
            <Section title="Songs">
              <SongList songs={results.data.songs} onPlayIndex={(index) => player.playQueue(results.data!.songs, index)} />
            </Section>
          ) : null}

          {results.data && results.data.albums.length > 0 ? (
            <Section title="Albums">
              <CardRow>
                {results.data.albums.map((album) => (
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
            </Section>
          ) : null}

          {results.data && results.data.artists.length > 0 ? (
            <Section title="Artists">
              <CardRow>
                {results.data.artists.map((artist) => (
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
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}
