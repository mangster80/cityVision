# Stadslyft

Stadslyft is a civic-tech web app for discovering places, sharing ideas for
improving public spaces, and building support around those ideas.

## What is implemented

- Explore places and proposals in a map or list view.
- Search places, neighbourhoods, and municipalities.
- Create proposals with location details and before/after images.
- Authenticate with Supabase email magic links and OAuth/PKCE callbacks.
- Comment on proposals, delete your own comments, and vote up or down.
- Support proposals and see supported proposals on a profile.
- Invite collaborators to proposals and accept invitations by email.
- View and edit your profile, including presence and last sign-in information.
- Switch between Swedish and English, with light and dark themes.
- Admin pages for registered users and database-backed translations.
- Vercel Analytics and Speed Insights in production.

Demo mode remains available as a local-storage fallback when Supabase is not
configured. Production data is stored in Supabase PostgreSQL.

## Tech stack

- Next.js 16, React 18, and TypeScript
- Tailwind CSS and Lucide React
- Leaflet and React Leaflet
- Supabase Auth, PostgreSQL, and Row Level Security
- Vercel Analytics and Speed Insights

The city data layer is accessed through `cityService` and the
`CityRepository` interface. The default
[`supabaseCityRepository`](./services/supabase-city-repository.ts) reads
places and proposals from Supabase. The mock repository is retained for the
demo fallback.

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

Open <http://localhost:3010>. The development server uses port `3010`.

## Environment variables

Add the Supabase project values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported as a legacy fallback. Never
commit `.env.local` or service-role keys.

## Supabase setup

1. Enable the Email provider and any OAuth providers used by the project.
2. Under **Authentication > URL Configuration**, add:
   - `http://localhost:3010/auth/callback`
   - `http://localhost:3010/auth/magic-link/callback`
3. Add the equivalent production callback URLs, for example
   `https://your-domain.com/auth/callback` and
   `https://your-domain.com/auth/oauth/callback`.
4. Run every SQL file in
   [`supabase/migrations/`](./supabase/migrations/) in timestamp order in the
   Supabase SQL Editor. The migrations create and seed places, proposals,
   profiles, comments, votes, proposal support, collaborators, invitations,
   translations, and the associated RLS policies.
5. Verify that the configured admin account can access `/admin`. Admin access
   is currently restricted to the administrator ID configured in
   `app/admin/layout.tsx`.

## Project structure

```text
app/                    Next.js routes and API callbacks
components/             Reusable UI components
services/               Supabase, repository, and feature services
locales/                Swedish and English fallback translations
supabase/migrations/    Database schema, seed data, and RLS policies
```

## Validation

Run these commands before deploying:

```bash
npm run lint
npm run build
```

Development builds use `.next-dev`; production builds use `.next`.

## Next steps

1. Replace the hard-coded admin user ID with a role-based authorization policy
   enforced in Supabase RLS and the server layout.
2. Move proposal images from inline data to Supabase Storage with upload
   limits, image validation, and image lifecycle management.
3. Add automated tests for authentication callbacks, RLS-sensitive mutations,
   proposal interactions, invitations, and admin permissions.
4. Add production monitoring and an end-to-end deployment checklist, including
   callback URLs, migration verification, and analytics validation.
