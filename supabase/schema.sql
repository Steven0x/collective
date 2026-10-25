-- COLLECTIVE schema v0. Matches src/data/*.json 1:1 so seed.json loads directly.
create extension if not exists postgis;

create table artists (
  id text primary key, slug text unique not null, name text not null,
  roles text[] not null, primary_craft text not null,
  city text, country text, lat double precision, lng double precision,
  geom geography(point) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  bio text, availability text, default_license text, portrait text, joined_at date, socials jsonb,
  user_id uuid references auth.users
);
create table works (
  id text primary key, slug text unique not null, type text not null, title text not null,
  owner_id text references artists, lat double precision, lng double precision, city text,
  year int, description text, media text[], price_usd numeric, drop_id text, license text
);
create table contributions (
  id text primary key, work_id text references works, contributor_id text references artists,
  role text not null, source_work_id text references works, split_pct numeric not null,
  status text not null default 'pending', confirmed_at date
);
create table influences (
  id text primary key, work_id text references works, place text, lat double precision, lng double precision,
  era text, tradition text, note text
);
create table timeline_events (
  id text primary key, work_id text references works, stage text, date date, city text,
  lat double precision, lng double precision, contribution_id text references contributions, media text
);
create table drops (id text primary key, name text, opens date, closes date, status text, goal_units int);
create table collectors (id text primary key, name text, city text, role text, user_id uuid references auth.users);
create table orders (
  id text primary key, collector_id text references collectors, work_id text references works, drop_id text references drops,
  qty int, unit_price_usd numeric, total_usd numeric, status text, placed_at date, stripe_session_id text
);
create table licenses (
  id text primary key, source_work_id text references works, licensee_id text references artists,
  scope text, royalty_pct numeric, status text, signed_at date
);
-- append-only: no update/delete policies, ever.
create table royalty_ledger (
  id text primary key, contribution_id text references contributions, artist_id text references artists,
  work_id text references works, order_id text references orders, license_id text references licenses,
  amount_usd numeric not null, currency text default 'USD', status text not null, created_at date
);

-- Lineage: walk backward from a work through contribution.source_work_id
create or replace function lineage(root text) returns setof contributions language sql stable as $$
  with recursive l as (
    select c.*, 0 as depth from contributions c where c.work_id = root
    union all
    select c.*, l.depth + 1 from contributions c join l on c.work_id = l.source_work_id where l.depth < 3
  ) select id, work_id, contributor_id, role, source_work_id, split_pct, status, confirmed_at from l;
$$;

alter table royalty_ledger enable row level security;
create policy "ledger is public" on royalty_ledger for select using (true);
