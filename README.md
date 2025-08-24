# Ajnad Nasheeds (Next.js + Supabase)

A modern web app to stream, download, favorite and organize Nasheeds. RTL Arabic UI matching the provided design: left player, right list.

## Quick start

1) Install deps

```bash
npm install
npm run dev
```

2) Env: copy `.env.example` to `.env.local` and fill

```bash
NEXT_PUBLIC_SUPABASE_URL=... 
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3) Supabase setup

- Create a project at https://supabase.com
- In the SQL editor, run `supabase/schema.sql`, then `supabase/policies.sql`.
- Create a public storage bucket named `nasheeds` and upload your audio files (MP3/OGG). Make them public or use signed URLs.
- Optionally run `supabase/seed.sql` to insert example rows.

4) Edge Functions (optional but recommended)

If you plan to serve data via Supabase Edge Functions:

```bash
# Install Supabase CLI first
# https://supabase.com/docs/guides/cli
supabase functions deploy nasheeds
supabase functions deploy favorites
supabase functions deploy playlists
```

Use the provided function sources under `supabase/functions/*`.

## Design

- RTL layout, dark navy + gold brand colors.
- Player left using `react-h5-audio-player`.
- Scrollable list right with play/download/info/favorite.

## Features

- Stream from Supabase Storage (public or signed URL).
- Search by title/artist.
- Favorites per user (email/password or Google via Supabase Auth).
- Playlists (Edge Function/API skeleton provided).

## Tech

- Next.js 14, App Router, TypeScript
- Tailwind CSS
- Supabase (Auth + Storage + DB + Edge Functions)
- Zustand for player state
- shadcn/ui primitives (Button, Input, ScrollArea)

## SQL Schema

See `supabase/schema.sql`.
