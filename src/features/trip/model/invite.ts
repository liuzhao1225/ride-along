import type { Trip } from "@/lib/types";
import { formatActivityDateDisplay } from "@/lib/activity-date";

export function normalizeInviteCode(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/\/t\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

export function buildTripInviteText(trip: Trip, inviteLink: string) {
  const tripDate = formatActivityDateDisplay(trip.event_at) ?? "待定";

  return [
    `一起去：${trip.name}`,
    `时间：${tripDate}`,
    `目的地：${trip.dest_name}`,
    "",
    "点开链接填一下你的出发地，顺手选下能不能开车、还能带几个人，我这边好一起把车位和路线安排明白。",
    "",
    "加入这趟：",
    inviteLink,
  ].join("\n");
}
