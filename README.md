# MTA Data Visualization

A **Next.js** app for exploring **NYC subway** service in real time: a live train map, system alerts, and a line performance leaderboard. The UI uses a retro “transit board” aesthetic (Mapbox map, rankings, shareable cards).

This project is **not affiliated with** the MTA. Live and alert data are aggregated from third-party APIs (see below).

## Features

### Live map (`/`)

- **Mapbox** map with NYC subway lines and **live train positions** derived from trip schedules (positions are interpolated between stops for smooth movement).
- **Line visibility toggles** so you can focus on specific routes.
- **Alerts sidebar** with subway service alerts (from GTFS-style feeds), **line-colored** accents matching official route colors, deduplicated listings, and optional **address search** to show nearby trains and walking time to the nearest station (geocoding via Mapbox).
- On **small screens**, a draggable divider adjusts how much space the map vs. alerts use (height is remembered in `localStorage`).

### Line rankings (`/rankings`)

- A **leaderboard** of all subway lines with composite scores driven by configurable weights: **delays**, **incidents** (informed by active alerts), and **accessibility** (static per-line proxy scores).
- **Share** flow that generates **Open Graph images** (`/api/share-card`) for social previews.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), React 19 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) + [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Tests | [Vitest](https://vitest.dev) |

## Data sources

The app does **not** call MTA `api.mta.info` directly. Server routes proxy and normalize data from **[nyc-subway-status.com](https://nyc-subway-status.com)** (lines, line detail, trips, and service alerts). Station coordinates and line metadata are aligned with that ecosystem.

Alerts are mapped to subway routes and **MTA-style colors** via `lib/subwayLineColors.ts` (aligned with the same palette as the lines feed).

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Map tiles, geocoding for “nearest trains” / address search |

Without a Mapbox token, map and geocoding features that depend on it will not work as intended.

## Scripts

```bash
npm install
npm run dev      # development server → http://localhost:3000
npm run build    # production build
npm run start    # run production server
npm run test     # Vitest (unit tests under `lib/`)
npm run lint     # ESLint
```

## Project layout (high level)

- `app/` — Routes: `page.tsx` (live dashboard), `rankings/page.tsx`, API handlers under `app/api/` (`lines`, `lines/[slug]`, `trips/[tripId]`, `alerts`, `share-card`).
- `components/` — UI: map (`LiveMap`, `LiveMapWrapper`), `TransitDashboard`, `AlertsSidebar`, `LineRankings`, `ShareModal`, navigation, etc.
- `lib/` — Types, live-train math (`liveMap.ts`), rankings (`rankingScores.ts`), geocoding, share-card OG styling, tests.

## Deploying

You can deploy on [Vercel](https://vercel.com) or any host that supports Next.js. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in the project’s environment settings.
