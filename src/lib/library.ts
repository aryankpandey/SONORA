import { supabase } from "@/integrations/supabase/client";
import type { Album, Artist, Playlist, Song } from "./music-types";

const SONG_FIELDS =
  "id, slug, title, audio_url, artwork_url, duration, genre, track_number, release_year, play_count, album_id, artist_id, artists(id,name,slug), albums(id,title,slug,artwork_url)";

function assertOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ---------------- liked songs ---------------- */

export async function fetchLikedSongIds(): Promise<string[]> {
  const { data, error } = await supabase.from("liked_songs").select("song_id");
  assertOk(error);
  return (data ?? []).map((row) => row.song_id as string);
}

export async function fetchLikedSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from("liked_songs")
    .select(`created_at, songs(${SONG_FIELDS})`)
    .order("created_at", { ascending: false });
  assertOk(error);
  return ((data ?? []) as unknown as { songs: Song }[]).map((row) => row.songs).filter(Boolean);
}

export async function setSongLiked(userId: string, songId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("liked_songs").insert({ user_id: userId, song_id: songId });
    assertOk(error);
  } else {
    const { error } = await supabase.from("liked_songs").delete().eq("user_id", userId).eq("song_id", songId);
    assertOk(error);
  }
}

/* ---------------- playlists ---------------- */

export async function fetchPlaylists(): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select("id, name, description, cover_url, created_at, updated_at")
    .order("updated_at", { ascending: false });
  assertOk(error);
  return (data ?? []) as unknown as Playlist[];
}

export async function fetchPlaylist(id: string): Promise<{ playlist: Playlist; songs: Song[] }> {
  const { data, error } = await supabase
    .from("playlists")
    .select("id, name, description, cover_url, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  if (!data) throw new Error("We couldn't find that playlist.");

  const { data: items, error: itemsError } = await supabase
    .from("playlist_songs")
    .select(`position, songs(${SONG_FIELDS})`)
    .eq("playlist_id", id)
    .order("position", { ascending: true });
  assertOk(itemsError);

  return {
    playlist: data as unknown as Playlist,
    songs: ((items ?? []) as unknown as { songs: Song }[]).map((row) => row.songs).filter(Boolean),
  };
}

export async function createPlaylist(userId: string, name: string, description?: string): Promise<Playlist> {
  const { data, error } = await supabase
    .from("playlists")
    .insert({ user_id: userId, name, description: description ?? null })
    .select("id, name, description, cover_url, created_at, updated_at")
    .single();
  assertOk(error);
  return data as unknown as Playlist;
}

export async function updatePlaylist(id: string, patch: { name?: string; description?: string | null }) {
  const { error } = await supabase.from("playlists").update(patch).eq("id", id);
  assertOk(error);
}

export async function deletePlaylist(id: string) {
  const { error } = await supabase.from("playlists").delete().eq("id", id);
  assertOk(error);
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  const { count, error: countError } = await supabase
    .from("playlist_songs")
    .select("id", { count: "exact", head: true })
    .eq("playlist_id", playlistId);
  assertOk(countError);
  const { error } = await supabase
    .from("playlist_songs")
    .insert({ playlist_id: playlistId, song_id: songId, position: count ?? 0 });
  if (error && error.message.toLowerCase().includes("duplicate")) {
    throw new Error("That song is already in this playlist.");
  }
  assertOk(error);
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);
  assertOk(error);
}

export async function reorderPlaylist(playlistId: string, orderedSongIds: string[]) {
  await Promise.all(
    orderedSongIds.map((songId, index) =>
      supabase
        .from("playlist_songs")
        .update({ position: index })
        .eq("playlist_id", playlistId)
        .eq("song_id", songId),
    ),
  );
}

/* ---------------- recently played ---------------- */

export async function fetchRecentlyPlayed(limit = 12): Promise<Song[]> {
  const { data, error } = await supabase
    .from("recently_played")
    .select(`played_at, songs(${SONG_FIELDS})`)
    .order("played_at", { ascending: false })
    .limit(50);
  assertOk(error);
  const songs = ((data ?? []) as unknown as { songs: Song }[]).map((row) => row.songs).filter(Boolean);
  const seen = new Set<string>();
  return songs.filter((song) => (seen.has(song.id) ? false : (seen.add(song.id), true))).slice(0, limit);
}

const recentWrites = new Map<string, number>();

/** Records a play, skipping duplicates for the same track within 5 minutes. */
export async function recordPlay(userId: string, songId: string) {
  const now = Date.now();
  const last = recentWrites.get(songId) ?? 0;
  if (now - last < 5 * 60 * 1000) return;
  recentWrites.set(songId, now);
  const { error } = await supabase.from("recently_played").insert({ user_id: userId, song_id: songId });
  if (error) console.warn("Could not record play history");
}

/* ---------------- saved albums / followed artists ---------------- */

export async function fetchSavedAlbums(): Promise<Album[]> {
  const { data, error } = await supabase
    .from("saved_albums")
    .select("created_at, albums(id, slug, title, artwork_url, release_year, artist_id, artists(id,name,slug))")
    .order("created_at", { ascending: false });
  assertOk(error);
  return ((data ?? []) as unknown as { albums: Album }[]).map((row) => row.albums).filter(Boolean);
}

export async function setAlbumSaved(userId: string, albumId: string, saved: boolean) {
  const { error } = saved
    ? await supabase.from("saved_albums").insert({ user_id: userId, album_id: albumId })
    : await supabase.from("saved_albums").delete().eq("user_id", userId).eq("album_id", albumId);
  assertOk(error);
}

export async function fetchFollowedArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("followed_artists")
    .select("created_at, artists(*)")
    .order("created_at", { ascending: false });
  assertOk(error);
  return ((data ?? []) as unknown as { artists: Artist }[]).map((row) => row.artists).filter(Boolean);
}

export async function setArtistFollowed(userId: string, artistId: string, followed: boolean) {
  const { error } = followed
    ? await supabase.from("followed_artists").insert({ user_id: userId, artist_id: artistId })
    : await supabase.from("followed_artists").delete().eq("user_id", userId).eq("artist_id", artistId);
  assertOk(error);
}

/* ---------------- profile ---------------- */

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .eq("id", userId)
    .maybeSingle();
  assertOk(error);
  return data;
}

export async function updateProfile(userId: string, patch: { display_name?: string; bio?: string | null }) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  assertOk(error);
}
