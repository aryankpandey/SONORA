export interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

export interface AlbumRef {
  id: string;
  title: string;
  slug: string;
  artwork_url: string | null;
}

export interface Song {
  id: string;
  slug: string;
  title: string;
  audio_url: string;
  artwork_url: string | null;
  duration: number;
  genre: string | null;
  track_number: number | null;
  release_year: number | null;
  play_count: number;
  album_id: string | null;
  artist_id: string;
  artists: ArtistRef | null;
  albums: AlbumRef | null;
}

export interface Album {
  id: string;
  slug: string;
  title: string;
  artwork_url: string | null;
  release_year: number | null;
  artist_id: string;
  artists: ArtistRef | null;
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  cover_url: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export const artistNameOf = (song: Song | null | undefined) => song?.artists?.name ?? "Unknown artist";
