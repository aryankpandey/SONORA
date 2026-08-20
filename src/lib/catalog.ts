import { supabase } from "@/integrations/supabase/client";
import type { Album, Artist, Song } from "./music-types";

const SONG_FIELDS =
  "id, slug, title, audio_url, artwork_url, duration, genre, track_number, release_year, play_count, album_id, artist_id, artists(id,name,slug), albums(id,title,slug,artwork_url)";
const ALBUM_FIELDS = "id, slug, title, artwork_url, release_year, artist_id, artists(id,name,slug)";

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export async function fetchTrendingSongs(limit = 12): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_FIELDS)
    .order("play_count", { ascending: false })
    .limit(limit);
  return unwrap(data as unknown as Song[], error);
}

export async function fetchNewReleases(limit = 12): Promise<Album[]> {
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_FIELDS)
    .order("release_year", { ascending: false })
    .limit(limit);
  return unwrap(data as unknown as Album[], error);
}

export async function fetchAlbums(limit = 24): Promise<Album[]> {
  const { data, error } = await supabase.from("albums").select(ALBUM_FIELDS).limit(limit);
  return unwrap(data as unknown as Album[], error);
}

export async function fetchArtists(limit = 24): Promise<Artist[]> {
  const { data, error } = await supabase.from("artists").select("*").limit(limit);
  return unwrap(data as unknown as Artist[], error);
}

export async function fetchSongsByGenre(genre: string, limit = 12): Promise<Song[]> {
  const { data, error } = await supabase.from("songs").select(SONG_FIELDS).eq("genre", genre).limit(limit);
  return unwrap(data as unknown as Song[], error);
}

/** Deterministic-ish picks so "Made for you" feels curated instead of random noise. */
export async function fetchQuickPicks(limit = 8): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_FIELDS)
    .order("created_at", { ascending: true })
    .limit(60);
  const songs = unwrap(data as unknown as Song[], error);
  return songs.filter((_, index) => index % 3 === 0).slice(0, limit);
}

export async function fetchAlbumBySlug(slug: string): Promise<{ album: Album; songs: Song[] }> {
  const { data: album, error } = await supabase.from("albums").select(ALBUM_FIELDS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!album) throw new Error("We couldn't find that album.");
  const { data: songs, error: songsError } = await supabase
    .from("songs")
    .select(SONG_FIELDS)
    .eq("album_id", (album as unknown as Album).id)
    .order("track_number", { ascending: true });
  if (songsError) throw new Error(songsError.message);
  return { album: album as unknown as Album, songs: (songs ?? []) as unknown as Song[] };
}

export async function fetchArtistBySlug(slug: string): Promise<{
  artist: Artist;
  popular: Song[];
  albums: Album[];
  related: Artist[];
}> {
  const { data: artist, error } = await supabase.from("artists").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!artist) throw new Error("We couldn't find that artist.");
  const artistRow = artist as unknown as Artist;

  const [popular, albums, related] = await Promise.all([
    supabase
      .from("songs")
      .select(SONG_FIELDS)
      .eq("artist_id", artistRow.id)
      .order("play_count", { ascending: false })
      .limit(6),
    supabase
      .from("albums")
      .select(ALBUM_FIELDS)
      .eq("artist_id", artistRow.id)
      .order("release_year", { ascending: false }),
    supabase.from("artists").select("*").neq("id", artistRow.id).limit(6),
  ]);

  return {
    artist: artistRow,
    popular: (popular.data ?? []) as unknown as Song[],
    albums: (albums.data ?? []) as unknown as Album[],
    related: (related.data ?? []) as unknown as Artist[],
  };
}

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

export async function searchCatalog(term: string): Promise<SearchResults> {
  const query = term.trim();
  if (!query) return { songs: [], albums: [], artists: [] };
  const pattern = `%${query.replace(/[%_]/g, "")}%`;

  const [songs, albums, artists] = await Promise.all([
    supabase.from("songs").select(SONG_FIELDS).ilike("title", pattern).limit(20),
    supabase.from("albums").select(ALBUM_FIELDS).ilike("title", pattern).limit(12),
    supabase.from("artists").select("*").ilike("name", pattern).limit(12),
  ]);

  if (songs.error) throw new Error(songs.error.message);

  return {
    songs: (songs.data ?? []) as unknown as Song[],
    albums: (albums.data ?? []) as unknown as Album[],
    artists: (artists.data ?? []) as unknown as Artist[],
  };
}
