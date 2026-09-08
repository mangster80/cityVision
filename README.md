# Stadslyft

Stadslyft is a civic-tech frontend for discovering places in a city, sharing improvement ideas, and supporting visions that make public spaces better.

## Features

- Explore places and proposals in a map or list view
- Search places, neighbourhoods, and municipalities
- Create proposals with location details and before/after images
- Sign in securely with Supabase email magic links
- Switch between Swedish and English, with light and dark themes

## Tech stack

- Next.js 16, React, and TypeScript
- Tailwind CSS and Lucide React
- Leaflet and React Leaflet for maps
- Supabase Auth and PostgreSQL
- Vercel Analytics and Speed Insights
- Repository-based data layer backed by Supabase for city reads, with mock data retained only for the demo-user fallback

The app is structured to replace mock data with PostgreSQL/PostGIS data incrementally. UI code accesses city data through `cityService`, which uses the `CityRepository` interface. The default repository now reads from Supabase-backed `places` and `proposals` tables via `services/supabase-city-repository.ts`, with the legacy mock repository kept as a fallback when Supabase is unavailable.

## Getting started

### Prerequisites

- Node.js 20 or later
- A Supabase project for authentication and persisted data

### Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3010](http://localhost:3010). The development server always uses port `3010` so it does not conflict with services using their default ports.

## Environment variables

Add your Supabase project values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported as a legacy fallback.

## Supabase setup

1. Enable the Email provider in Supabase Authentication.
2. Under **Authentication > URL Configuration**, add `http://localhost:3010/auth/callback` as a redirect URL.
3. Add your production callback URLs, for example `https://your-domain.com/auth/callback` and `https://your-domain.com/auth/oauth/callback`. The OAuth flow starts server-side at `/auth/oauth/start` so its PKCE verifier is stored in cookies.
4. Run the SQL files in [`supabase/migrations/`](./supabase/migrations/) in timestamp order using the Supabase SQL Editor.

The `202609072300_create_places.sql` migration creates a publicly readable `places` table and seeds the ten existing demo places. Follow it with `202609072310_migrate_place_ids_to_uuid.sql`, which converts `places` and matching `proposals.place_id` values to UUIDs, then restores their foreign-key relationship. Run `202609072340_drop_legacy_place_id.sql` if an earlier migration version left a `legacy_id` column behind. Then run `202609072330_seed_demo_proposals.sql` to import the 17 demo proposals and `202609072350_create_proposal_supports.sql` to enable supported proposals on user profiles.

## Analytics and performance

This project includes Vercel analytics tools:

```bash
npm i @vercel/analytics @vercel/speed-insights
```

The components are mounted in the root layout, which enables page analytics and performance monitoring in production deployments on Vercel.

## Validation

Run these commands before deploying:

```bash
npm run lint
npm run build
```

Development builds use `.next-dev`, while production builds use `.next`; they can therefore run without overwriting each other's caches.

## Current data model

Authentication and proposal creation are connected to Supabase. Place and proposal reads are now served from the database-backed repository, while the demo user remains as a local-only fallback for development/testing. User preferences and the demo user are stored together in the browser's `localStorage` under `cityvision-user`.
