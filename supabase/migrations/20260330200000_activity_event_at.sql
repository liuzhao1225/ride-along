-- 活动日期/时间（可选，旧数据为 null）
alter table public.ride_along_activities
  add column if not exists event_at timestamptz;
