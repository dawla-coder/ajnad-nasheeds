-- Row Level Security
alter table public.nasheeds enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_nasheeds enable row level security;
alter table public.favorites enable row level security;

-- nasheeds are public readable
create policy if not exists "Public read nasheeds" on public.nasheeds for select to public using (true);

-- playlists: owner can CRUD, others can read if playlist is public (not implemented here -> owner read only)
create policy if not exists "Playlists owner select" on public.playlists for select using (auth.uid() = user_id);
create policy if not exists "Playlists owner insert" on public.playlists for insert with check (auth.uid() = user_id);
create policy if not exists "Playlists owner update" on public.playlists for update using (auth.uid() = user_id);
create policy if not exists "Playlists owner delete" on public.playlists for delete using (auth.uid() = user_id);

-- playlist items follow playlist owner
create policy if not exists "Playlist items select" on public.playlist_nasheeds for select using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);
create policy if not exists "Playlist items insert" on public.playlist_nasheeds for insert with check (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);
create policy if not exists "Playlist items delete" on public.playlist_nasheeds for delete using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);

-- favorites per user
create policy if not exists "Favorites owner select" on public.favorites for select using (auth.uid() = user_id);
create policy if not exists "Favorites owner insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy if not exists "Favorites owner delete" on public.favorites for delete using (auth.uid() = user_id);
