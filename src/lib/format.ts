/** Formats seconds as m:ss (or h:mm:ss for long durations). */
export function formatDuration(totalSeconds: number | null | undefined): string {
  const seconds = Math.max(0, Math.floor(totalSeconds ?? 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** "1h 12min" style summary used on album headers. */
export function formatTotalDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

/** Human-readable message for any thrown value; never leaks raw database errors. */
export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "That email or password doesn't match an account.";
  if (lower.includes("already registered") || lower.includes("already been registered"))
    return "An account with that email already exists. Try signing in.";
  if (lower.includes("password")) return "Please choose a password with at least 8 characters.";
  if (lower.includes("row-level security") || lower.includes("permission") || lower.includes("jwt"))
    return "You need to be signed in to do that.";
  if (lower.includes("fetch") || lower.includes("network")) return "Network trouble — check your connection and retry.";
  if (lower.includes("duplicate")) return "That's already in your library.";
  return fallback;
}
