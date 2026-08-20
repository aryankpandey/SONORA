import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Library, ListMusic, LogOut, Search, User, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PlayerBar } from "@/components/player/PlayerBar";
import { NowPlayingOverlay } from "@/components/player/NowPlayingOverlay";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { useAuth } from "@/context/AuthContext";
import { usePlaylists } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="SONORA home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-ember text-primary-foreground shadow-glow">
        <ListMusic className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight">SONORA</span>
    </Link>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const { data: playlists } = usePlaylists();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-3 p-3 lg:flex">
      <div className="surface-card p-4">
        <Brand />
        <p className="mt-2 text-xs text-muted-foreground">Your sound. Your space.</p>
      </div>

      <nav className="surface-card p-2" aria-label="Main">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground",
                  pathname === item.to && "bg-surface-raised text-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/liked"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground",
                pathname === "/liked" && "bg-surface-raised text-foreground",
              )}
            >
              <Heart className="h-4.5 w-4.5" aria-hidden />
              Liked Songs
            </Link>
          </li>
        </ul>
      </nav>

      <div className="surface-card flex min-h-0 flex-1 flex-col p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Playlists</span>
          <CreatePlaylistDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Create playlist">
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            }
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          {!user ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Sign in to build your own playlists.</p>
          ) : playlists && playlists.length > 0 ? (
            <ul className="space-y-0.5">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <Link
                    to="/playlist/$id"
                    params={{ id: playlist.id }}
                    className="block truncate rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                  >
                    {playlist.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">No playlists yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  return (
    <header className="glass-panel sticky top-0 z-30 flex items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="lg:hidden">
        <Brand />
      </div>
      <form
        role="search"
        className="ml-auto hidden max-w-md flex-1 items-center gap-2 sm:flex lg:ml-0"
        onSubmit={(event) => {
          event.preventDefault();
          void navigate({ to: "/search", search: { q: term } });
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Search songs, albums and artists
        </label>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="global-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="What do you want to hear?"
            className="rounded-full border-border bg-surface pl-9"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2 sm:ml-0">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-ring focus-visible:ring-2"
                aria-label="Account menu"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-surface-raised text-sm font-semibold">
                    {(user.email ?? "S").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void navigate({ to: "/profile" })}>
                <User className="mr-2 h-4 w-4" aria-hidden /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void navigate({ to: "/library" })}>
                <Library className="mr-2 h-4 w-4" aria-hidden /> Your library
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  await signOut();
                  void navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" className="rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      className="glass-panel fixed inset-x-0 bottom-0 z-30 flex items-center justify-around rounded-none border-x-0 border-b-0 px-2 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden"
      aria-label="Primary"
    >
      {[...NAV, { to: "/liked", label: "Liked", icon: Heart } as const].map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[0.68rem] font-medium text-muted-foreground transition-colors",
            pathname === item.to && "text-primary",
          )}
        >
          <item.icon className="h-5 w-5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 gradient-hero px-4 pb-56 pt-6 sm:px-6 lg:pb-32">{children}</main>
      </div>
      <PlayerBar />
      <NowPlayingOverlay />
      <MobileNav />
    </div>
  );
}
