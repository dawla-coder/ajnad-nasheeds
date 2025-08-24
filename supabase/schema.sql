-- Enable extensions
create extension if not exists pgcrypto;

-- nasheeds table
create table if not exists public.nasheeds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  duration integer,
  file_url text not null,
  cover_url text,
  published boolean not null default false,
  created_at timestamp with time zone default now()
);

-- playlists table (owned by a user)
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- playlist_nasheeds join table
create table if not exists public.playlist_nasheeds (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  nasheed_id uuid not null references public.nasheeds(id) on delete cascade
);

-- favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nasheed_id uuid not null references public.nasheeds(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Helpful index
create index if not exists idx_nasheeds_created_at on public.nasheeds(created_at desc);
create index if not exists idx_nasheeds_published on public.nasheeds(published);
create unique index if not exists idx_favorites_unique on public.favorites(user_id, nasheed_id);
create index if not exists idx_playlist_items_playlist on public.playlist_nasheeds(playlist_id);
