export interface Trip {
  id: string;
  name: string;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  /** Unix 秒；未设置时为 null */
  event_at: number | null;
  /** 创建者用户 id */
  created_by: string | null;
  /** 创建时的展示名快照 */
  creator_display_name: string | null;
  /** Unix 秒；已解散时非 null */
  disbanded_at: number | null;
  created_at: number;
}

export interface TripMember {
  id: string;
  activity_id: string;
  user_id: string;
  nickname: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  has_car: number;
  seats: number;
  assigned_driver: string | null;
  pickup_order: number | null;
  is_free_agent: boolean;
  created_at: number;
}

export type Activity = Trip;
export type Participant = TripMember;
