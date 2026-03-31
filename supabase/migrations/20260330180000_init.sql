-- 与同项目其他应用共用数据库；本应用表名均以 ride_along_ 为前缀。
-- 在 Supabase SQL Editor 中执行。无历史数据时可忽略旧表名。

create table public.ride_along_activities (
  id text primary key,
  name text not null,
  dest_name text not null,
  dest_lat double precision not null,
  dest_lng double precision not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.ride_along_participants (
  id text primary key,
  activity_id text not null references public.ride_along_activities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  has_car smallint not null default 0,
  seats smallint not null default 0,
  assigned_driver text references public.ride_along_participants (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index idx_ride_along_participants_activity on public.ride_along_participants (activity_id);
create index idx_ride_along_participants_user on public.ride_along_participants (user_id);
create index idx_ride_along_participants_assigned on public.ride_along_participants (assigned_driver);

alter table public.ride_along_activities enable row level security;
alter table public.ride_along_participants enable row level security;

create policy "ride_along_activities_read_authenticated" on public.ride_along_activities
  for select to authenticated using (true);

create policy "ride_along_participants_read_authenticated" on public.ride_along_participants
  for select to authenticated using (true);

create policy "ride_along_activities_insert_creator" on public.ride_along_activities
  for insert to authenticated with check (created_by = auth.uid());

create policy "ride_along_participants_insert_self" on public.ride_along_participants
  for insert to authenticated with check (user_id = auth.uid());

create policy "ride_along_participants_update_self" on public.ride_along_participants
  for update to authenticated using (user_id = auth.uid());
