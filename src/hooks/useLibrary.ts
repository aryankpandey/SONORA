import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { friendlyError } from "@/lib/format";
import {
  addSongToPlaylist,
  createPlaylist,
  fetchFollowedArtists,
  fetchLikedSongIds,
  fetchPlaylists,
  fetchRecentlyPlayed,
  fetchSavedAlbums,
  setAlbumSaved,
  setArtistFollowed,
  setSongLiked,
} from "@/lib/library";

export function useLikedSongIds() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["liked-ids", user?.id],
    queryFn: fetchLikedSongIds,
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  return new Set(query.data ?? []);
}

export function useToggleLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, liked }: { songId: string; liked: boolean }) => {
      if (!user) throw new Error("You need to be signed in to do that.");
      await setSongLiked(user.id, songId, liked);
      return liked;
    },
    onSuccess: (liked) => {
      toast.success(liked ? "Added to Liked Songs." : "Removed from Liked Songs.");
      void queryClient.invalidateQueries({ queryKey: ["liked-ids"] });
      void queryClient.invalidateQueries({ queryKey: ["liked-songs"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't update your liked songs.")),
  });
}

export function usePlaylists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: fetchPlaylists,
    enabled: Boolean(user),
  });
}

export function useCreatePlaylist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error("You need to be signed in to do that.");
      return createPlaylist(user.id, name, description);
    },
    onSuccess: () => {
      toast.success("Playlist created.");
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't create that playlist.")),
  });
}

export function useAddToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      addSongToPlaylist(playlistId, songId),
    onSuccess: () => {
      toast.success("Added to your playlist.");
      void queryClient.invalidateQueries({ queryKey: ["playlist"] });
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't add that song.")),
  });
}

export function useRecentlyPlayed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recently-played", user?.id],
    queryFn: () => fetchRecentlyPlayed(12),
    enabled: Boolean(user),
  });
}

export function useSavedAlbums() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-albums", user?.id],
    queryFn: fetchSavedAlbums,
    enabled: Boolean(user),
  });
}

export function useFollowedArtists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followed-artists", user?.id],
    queryFn: fetchFollowedArtists,
    enabled: Boolean(user),
  });
}

export function useToggleSavedAlbum() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ albumId, saved }: { albumId: string; saved: boolean }) => {
      if (!user) throw new Error("You need to be signed in to do that.");
      await setAlbumSaved(user.id, albumId, saved);
      return saved;
    },
    onSuccess: (saved) => {
      toast.success(saved ? "Album saved to your library." : "Album removed from your library.");
      void queryClient.invalidateQueries({ queryKey: ["saved-albums"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't update your library.")),
  });
}

export function useToggleFollowArtist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ artistId, followed }: { artistId: string; followed: boolean }) => {
      if (!user) throw new Error("You need to be signed in to do that.");
      await setArtistFollowed(user.id, artistId, followed);
      return followed;
    },
    onSuccess: (followed) => {
      toast.success(followed ? "Following this artist." : "Unfollowed.");
      void queryClient.invalidateQueries({ queryKey: ["followed-artists"] });
    },
    onError: (error) => toast.error(friendlyError(error, "Couldn't update your library.")),
  });
}
