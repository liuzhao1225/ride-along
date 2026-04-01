alter table public.ride_along_participants
  add column if not exists pickup_order smallint;

create index if not exists idx_ride_along_participants_driver_order
  on public.ride_along_participants (assigned_driver, pickup_order);
