import { nanoid } from "nanoid";
import { createAdminClient } from "./supabase/admin";
import type { Trip, TripMember } from "./types";

const ACT = "ride_along_activities" as const;
const PART = "ride_along_participants" as const;

function ts(row: string | null): number {
  if (!row) return 0;
  return Math.floor(new Date(row).getTime() / 1000);
}

function tsOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Math.floor(new Date(String(v)).getTime() / 1000);
  return Number.isFinite(n) ? n : null;
}

function mapActivity(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    dest_name: row.dest_name as string,
    dest_lat: Number(row.dest_lat),
    dest_lng: Number(row.dest_lng),
    event_at: tsOrNull(row.event_at),
    created_by: row.created_by != null ? String(row.created_by) : null,
    creator_display_name:
      (row.creator_display_name as string | null | undefined) ?? null,
    disbanded_at: tsOrNull(row.disbanded_at),
    created_at: ts(row.created_at as string),
  };
}

export function isActivityDisbanded(activity: Trip): boolean {
  return activity.disbanded_at != null;
}

function mapParticipant(row: Record<string, unknown>): TripMember {
  return {
    id: row.id as string,
    activity_id: row.activity_id as string,
    user_id: String(row.user_id),
    nickname: row.nickname as string,
    location_name: (row.location_name as string) ?? null,
    location_lat:
      row.location_lat != null ? Number(row.location_lat) : null,
    location_lng:
      row.location_lng != null ? Number(row.location_lng) : null,
    has_car: Number(row.has_car) ? 1 : 0,
    seats: Number(row.seats) ?? 0,
    assigned_driver: (row.assigned_driver as string) ?? null,
    pickup_order:
      row.pickup_order != null ? Number(row.pickup_order) : null,
    is_free_agent:
      row.is_free_agent == null ? true : Boolean(row.is_free_agent),
    created_at: ts(row.created_at as string),
  };
}

export async function createActivity(
  userId: string,
  name: string,
  destName: string,
  destLat: number,
  destLng: number,
  eventAtIso?: string | null,
  creatorDisplayName?: string | null
): Promise<Trip> {
  const supabase = createAdminClient();
  const id = nanoid(10);
  const { data, error } = await supabase
    .from(ACT)
    .insert({
      id,
      name,
      dest_name: destName,
      dest_lat: destLat,
      dest_lng: destLng,
      created_by: userId,
      event_at: eventAtIso ?? null,
      creator_display_name: creatorDisplayName ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapActivity(data as Record<string, unknown>);
}

/** 仅创建者可解散；已解散则幂等成功 */
export async function disbandActivity(
  activityId: string,
  userId: string
): Promise<{ ok: boolean; reason?: "not_found" | "forbidden" }> {
  const supabase = createAdminClient();
  const activity = await getActivity(activityId);
  if (!activity) return { ok: false, reason: "not_found" };
  if (activity.created_by !== userId) {
    return { ok: false, reason: "forbidden" };
  }
  if (isActivityDisbanded(activity)) {
    return { ok: true };
  }
  const { error } = await supabase
    .from(ACT)
    .update({ disbanded_at: new Date().toISOString() })
    .eq("id", activityId)
    .eq("created_by", userId);

  if (error) throw error;
  return { ok: true };
}

/** 当前用户作为参与者出现过的活动（按创建时间倒序） */
export async function listActivitiesForUser(
  userId: string
): Promise<Trip[]> {
  const supabase = createAdminClient();
  const { data: parts, error: e1 } = await supabase
    .from(PART)
    .select("activity_id")
    .eq("user_id", userId);

  if (e1) throw e1;
  const ids = [...new Set((parts ?? []).map((p) => (p as { activity_id: string }).activity_id))];
  if (ids.length === 0) return [];

  const { data: rows, error: e2 } = await supabase
    .from(ACT)
    .select()
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (e2) throw e2;
  return (rows ?? []).map((r) => mapActivity(r as Record<string, unknown>));
}

export async function getActivity(id: string): Promise<Trip | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(ACT)
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapActivity(data as Record<string, unknown>);
}

export async function getParticipants(
  activityId: string
): Promise<TripMember[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(PART)
    .select()
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) =>
    mapParticipant(r as Record<string, unknown>)
  );
}

export async function joinActivity(
  activityId: string,
  userId: string,
  nickname: string
): Promise<TripMember> {
  const supabase = createAdminClient();

  const activity = await getActivity(activityId);
  if (!activity) {
    throw new Error("activity_not_found");
  }

  const { data: existing } = await supabase
    .from(PART)
    .select()
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if ((existing as { nickname: string }).nickname !== nickname) {
      const { data: upd, error } = await supabase
        .from(PART)
        .update({ nickname })
        .eq("id", (existing as { id: string }).id)
        .select()
        .single();
      if (error) throw error;
      return mapParticipant(upd as Record<string, unknown>);
    }
    return mapParticipant(existing as Record<string, unknown>);
  }

  if (isActivityDisbanded(activity)) {
    throw new Error("activity_disbanded");
  }

  const id = nanoid(10);
  const { data, error } = await supabase
    .from(PART)
    .insert({
      id,
      activity_id: activityId,
      user_id: userId,
      nickname,
      is_free_agent: true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapParticipant(data as Record<string, unknown>);
}

export async function getParticipantById(
  participantId: string
): Promise<TripMember | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(PART)
    .select()
    .eq("id", participantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapParticipant(data as Record<string, unknown>);
}

export async function updateParticipant(
  participantId: string,
  updates: {
    location_name?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    has_car?: number;
    seats?: number;
    nickname?: string;
    pickup_order?: number | null;
    is_free_agent?: boolean;
  }
): Promise<TripMember | null> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) payload[k] = v;
  }
  if (Object.keys(payload).length === 0) {
    return getParticipantById(participantId);
  }

  const { data, error } = await supabase
    .from(PART)
    .update(payload)
    .eq("id", participantId)
    .select()
    .single();

  if (error) throw error;

  if (updates.has_car === 0) {
    await supabase
      .from(PART)
      .update({ assigned_driver: null, pickup_order: null })
      .eq("assigned_driver", participantId);
  }

  return mapParticipant(data as Record<string, unknown>);
}

export async function assignRide(
  passengerId: string,
  driverId: string | null,
  pickupOrder: number | null = null,
  isFreeAgent?: boolean
): Promise<void> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    assigned_driver: driverId,
    pickup_order: pickupOrder,
  };
  if (isFreeAgent !== undefined) {
    payload.is_free_agent = isFreeAgent;
  }
  const { error } = await supabase
    .from(PART)
    .update(payload)
    .eq("id", passengerId);

  if (error) throw error;
}

export async function bulkAssignRides(
  assignments: {
    passengerId: string;
    driverId: string | null;
    pickupOrder: number | null;
  }[]
): Promise<void> {
  const supabase = createAdminClient();
  for (const { passengerId, driverId, pickupOrder } of assignments) {
    const { error } = await supabase
      .from(PART)
      .update({ assigned_driver: driverId, pickup_order: pickupOrder })
      .eq("id", passengerId);
    if (error) throw error;
  }
}

export async function clearAutoAssignableAssignments(
  activityId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from(PART)
    .update({ assigned_driver: null, pickup_order: null })
    .eq("activity_id", activityId)
    .eq("has_car", 0)
    .eq("is_free_agent", true);

  if (error) throw error;
}

export async function leaveActivity(
  activityId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();
  const { data: participant, error: fetchError } = await supabase
    .from(PART)
    .select()
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!participant) return;

  const participantId = (participant as { id: string }).id;

  await supabase
    .from(PART)
    .update({ assigned_driver: null, pickup_order: null })
    .eq("assigned_driver", participantId);

  const { error } = await supabase.from(PART).delete().eq("id", participantId);
  if (error) throw error;
}
