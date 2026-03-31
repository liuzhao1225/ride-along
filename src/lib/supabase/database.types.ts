export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      ride_along_activities: {
        Row: {
          id: string;
          name: string;
          dest_name: string;
          dest_lat: number;
          dest_lng: number;
          event_at: string | null;
          created_at: string;
          created_by: string | null;
          creator_display_name: string | null;
          disbanded_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          dest_name: string;
          dest_lat: number;
          dest_lng: number;
          event_at?: string | null;
          created_by?: string | null;
          creator_display_name?: string | null;
        };
        Update: {
          name?: string;
          dest_name?: string;
          dest_lat?: number;
          dest_lng?: number;
          event_at?: string | null;
          created_by?: string | null;
          creator_display_name?: string | null;
          disbanded_at?: string | null;
        };
        Relationships: [];
      };
      ride_along_participants: {
        Row: {
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
          created_at: string;
        };
        Insert: {
          id: string;
          activity_id: string;
          user_id: string;
          nickname: string;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          has_car?: number;
          seats?: number;
          assigned_driver?: string | null;
        };
        Update: {
          nickname?: string;
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          has_car?: number;
          seats?: number;
          assigned_driver?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
