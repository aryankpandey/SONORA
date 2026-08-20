import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface SectionProps {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
}

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CardRow({ children }: { children: ReactNode }) {
  return <div className="scroll-row -mx-2 px-2">{children}</div>;
}

export function CardRowSkeleton({ count = 6, circle = false }: { count?: number; circle?: boolean }) {
  return (
    <div className="scroll-row -mx-2 px-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-40 shrink-0 space-y-3 p-2 sm:w-44">
          <Skeleton className={circle ? "aspect-square rounded-full" : "aspect-square rounded-xl"} />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
