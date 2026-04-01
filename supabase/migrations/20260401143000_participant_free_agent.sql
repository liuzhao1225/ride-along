alter table public.ride_along_participants
  add column if not exists is_free_agent boolean not null default true;

create index if not exists idx_ride_along_participants_free_agent
  on public.ride_along_participants (activity_id, has_car, is_free_agent);
