import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

import { Artwork } from "./Artwork";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  to: string;
  params?: Record<string, string> | undefined;
  title: string;
  subtitle?: string | undefined;
  image?: string | null | undefined;
  circle?: boolean | undefined;
  onPlay?: (() => void) | undefined;
}

export function MediaCard({ to, params, title, subtitle, image, circle, onPlay }: MediaCardProps) {
  return (
    <div className="group relative w-40 shrink-0 scroll-ml-4 snap-start sm:w-44">
      <Link
        to={to as never}
        params={(params ?? {}) as never}
        className="block rounded-2xl p-2 transition-colors hover:bg-surface focus-visible:bg-surface"
      >
        <div className={cn("relative aspect-square overflow-hidden", circle ? "rounded-full" : "rounded-xl")}>
          <Artwork
            src={image}
            alt={title}
            rounded={circle ? "full" : "lg"}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <p className="mt-3 truncate text-sm font-semibold">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </Link>
      {onPlay ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${title}`}
          className="absolute right-4 top-[45%] flex h-11 w-11 translate-y-3 items-center justify-center rounded-full gradient-ember text-primary-foreground opacity-0 shadow-glow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <Play className="h-5 w-5 fill-current" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
