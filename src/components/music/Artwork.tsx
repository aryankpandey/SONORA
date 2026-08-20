import { Disc3 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ArtworkProps {
  src?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  rounded?: "md" | "lg" | "full" | undefined;
}

/** Lazy-loaded artwork with a graceful fallback when an image is missing or broken. */
export function Artwork({ src, alt, className, rounded = "lg" }: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "full" ? "rounded-full" : rounded === "md" ? "rounded-md" : "rounded-xl";

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface-raised text-muted-foreground",
          radius,
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <Disc3 className="h-1/3 w-1/3" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full bg-surface-raised object-cover", radius, className)}
    />
  );
}
