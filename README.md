# SONORA

A focused, production-quality music streaming web app built for discovering, collecting and playing tracks.

## Features

- **Discovery** — browse trending songs, new releases, popular albums and artists.
- **Search** — find songs, albums and artists in real time.
- **Persistent player** — a global audio player with queue, shuffle, repeat and playback history.
- **Library** — liked songs, saved albums, followed artists and recently played.
- **Playlists** — create personal playlists, add/remove songs and edit details.
- **Responsive design** — works on desktop, tablet and mobile.

## Tech stack

- **Framework:** TanStack Start + React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend / Auth / Database:** Supabase (PostgreSQL)

## Development

Requirements: Node.js 20+ and a package manager such as `npm` or `bun`.

```sh
git clone <repository-url>
cd <repository-name>
bun install
bun run dev
```

The dev server starts on `http://localhost:8080`.

## Build

```sh
bun run build
```

## Project structure

- `src/routes/` — TanStack Router pages
- `src/components/` — reusable UI and music components
- `src/context/` — React context providers (auth, player)
- `src/lib/` — helpers, catalog and library data functions
- `src/hooks/` — custom React hooks
- `database/` — schema and seed SQL
