import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { recordPlay } from "@/lib/library";
import type { Song } from "@/lib/music-types";
import { useAuth } from "./AuthContext";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Song[];
  index: number;
  current: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  expanded: boolean;
}

interface PlayerContextValue extends PlayerState {
  playQueue: (songs: Song[], startIndex?: number, options?: { shuffle?: boolean }) => void;
  playSong: (song: Song) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setExpanded: (value: boolean) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = "sonora.volume";

function shuffled<T>(items: T[], keepFirst?: T): T[] {
  const rest = items.filter((item) => item !== keepFirst);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return keepFirst ? [keepFirst, ...rest] : rest;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatRef = useRef<RepeatMode>("off");

  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [expanded, setExpanded] = useState(false);

  const current = queue[index] ?? null;
  repeatRef.current = repeat;

  // One global audio element for the whole app.
  const getAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const advance = useCallback(
    (direction: 1 | -1, auto = false) => {
      setIndex((currentIndex) => {
        const total = queue.length;
        if (total === 0) return 0;
        if (auto && repeatRef.current === "one") return currentIndex;
        const nextIndex = currentIndex + direction;
        if (nextIndex >= total) return repeatRef.current === "all" || !auto ? 0 : currentIndex;
        if (nextIndex < 0) return 0;
        return nextIndex;
      });
      if (auto && repeatRef.current === "one") {
        const audio = getAudio();
        if (audio) {
          audio.currentTime = 0;
          void audio.play();
        }
      }
    },
    [queue.length, getAudio],
  );

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const stored = window.localStorage.getItem(VOLUME_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setVolumeState(parsed);
        audio.volume = parsed;
      }
    }

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsLoading(false);
    };
    const onEnded = () => {
      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      advance(1, true);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      toast.error("This track wouldn't load. Skipping ahead.");
      advance(1, true);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [getAudio, advance]);

  // Load and play whenever the active track changes.
  useEffect(() => {
    const audio = getAudio();
    if (!audio || !current) return;
    if (audio.dataset["songId"] === current.id) return;
    audio.dataset["songId"] = current.id;
    audio.src = current.audio_url;
    setProgress(0);
    setDuration(current.duration ?? 0);
    setIsLoading(true);
    void audio.play().catch(() => setIsLoading(false));
    if (user) void recordPlay(user.id, current.id);
  }, [current, getAudio, user]);

  const playQueue = useCallback<PlayerContextValue["playQueue"]>((songs, startIndex = 0, options) => {
    if (songs.length === 0) {
      toast("Nothing to play here yet.");
      return;
    }
    if (options?.shuffle) {
      setShuffle(true);
      const ordered = shuffled(songs, songs[startIndex]);
      setQueue(ordered);
      setIndex(0);
      return;
    }
    setQueue(songs);
    setIndex(Math.min(Math.max(startIndex, 0), songs.length - 1));
  }, []);

  const playSong = useCallback((song: Song) => {
    setQueue([song]);
    setIndex(0);
  }, []);

  const toggle = useCallback(() => {
    const audio = getAudio();
    if (!audio || !current) return;
    if (audio.paused) {
      void audio.play().catch(() => toast.error("Playback failed. Try another track."));
    } else {
      audio.pause();
    }
  }, [getAudio, current]);

  const previous = useCallback(() => {
    const audio = getAudio();
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    advance(-1);
  }, [advance, getAudio]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      expanded,
      playQueue,
      playSong,
      toggle,
      next: () => advance(1),
      previous,
      seek: (seconds) => {
        const audio = getAudio();
        if (!audio) return;
        audio.currentTime = seconds;
        setProgress(seconds);
      },
      setVolume: (nextVolume) => {
        const audio = getAudio();
        setVolumeState(nextVolume);
        setMuted(nextVolume === 0);
        if (audio) {
          audio.volume = nextVolume;
          audio.muted = false;
        }
        window.localStorage.setItem(VOLUME_KEY, String(nextVolume));
      },
      toggleMute: () => {
        const audio = getAudio();
        setMuted((wasMuted) => {
          if (audio) audio.muted = !wasMuted;
          return !wasMuted;
        });
      },
      toggleShuffle: () => {
        setShuffle((wasShuffled) => {
          if (!wasShuffled && queue.length > 1) {
            const active = queue[index];
            const reordered = shuffled(queue, active);
            setQueue(reordered);
            setIndex(0);
          }
          return !wasShuffled;
        });
      },
      cycleRepeat: () =>
        setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off")),
      setExpanded,
      addToQueue: (song) => {
        setQueue((items) => (items.some((item) => item.id === song.id) ? items : [...items, song]));
        toast.success("Added to your queue.");
      },
      removeFromQueue: (removeIndex) => {
        setQueue((items) => items.filter((_, i) => i !== removeIndex));
        setIndex((i) => (removeIndex < i ? i - 1 : i));
      },
    }),
    [
      queue,
      index,
      current,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      expanded,
      playQueue,
      playSong,
      toggle,
      previous,
      advance,
      getAudio,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}
