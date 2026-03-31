-- 创建人展示名、解散时间；并将现有活动活动日期统一为 2026-04-04（东八区当日 0 点，仅作日历日存储）
alter table public.ride_along_activities
  add column if not exists creator_display_name text,
  add column if not exists disbanded_at timestamptz;

update public.ride_along_activities
set event_at = timestamptz '2026-04-04 00:00:00+08'
where true;
