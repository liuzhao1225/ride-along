"use client";

import { createContext, useContext } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Activity, Participant } from "@/lib/types";

export interface ActivityDataContextValue {
  activityId: string;
  activity: Activity;
  participants: Participant[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  user: User | null;
  authLoading: boolean;
  myParticipant: Participant | undefined;
  supabase: SupabaseClient;
  showAuth: boolean;
  setShowAuth: (open: boolean) => void;
  /** 当前用户是否为活动创建者 */
  isCreator: boolean;
  disbanding: boolean;
  disbandActivity: () => Promise<void>;
}

export const ActivityDataContext =
  createContext<ActivityDataContextValue | null>(null);

export function useActivityData(): ActivityDataContextValue {
  const ctx = useContext(ActivityDataContext);
  if (!ctx) {
    throw new Error("useActivityData must be used within ActivityLayoutClient");
  }
  return ctx;
}
