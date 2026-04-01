"use client";

import type { Trip, TripMember } from "@/lib/types";
import type { TripDashboardData } from "../types";
import { fetchJson } from "./fetch-json";

interface CreateTripInput {
  title: string;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  trip_date: string;
}

interface TripProfileUpdates {
  nickname?: string;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  has_car?: number;
  seats?: number;
}

interface TripAssignmentUpdates {
  driver_member_id: string | null;
}

export const tripClient = {
  getDashboard(tripId: string) {
    return fetchJson<TripDashboardData>(`/api/trips/${tripId}`);
  },

  createTrip(input: CreateTripInput) {
    return fetchJson<{ trip: Trip }>("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  listMine() {
    return fetchJson<{ trips: Trip[] }>("/api/trips/mine");
  },

  joinTrip(tripId: string, nickname: string) {
    return fetchJson<{ member: TripMember }>(`/api/trips/${tripId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
  },

  updateMyProfile(tripId: string, updates: TripProfileUpdates) {
    return fetchJson<{ member: TripMember }>(`/api/trips/${tripId}/my-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  },

  async saveMyProfileAndRefreshAssignments(
    tripId: string,
    updates: TripProfileUpdates,
    unlockSelf = false
  ) {
    await this.updateMyProfile(tripId, updates);
    return this.autoAssignTrip(tripId, unlockSelf);
  },

  autoAssignTrip(tripId: string, unlockSelf = true) {
    return fetchJson<TripDashboardData>(`/api/trips/${tripId}/auto-assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlock_self: unlockSelf }),
    });
  },

  updateTrip(
    tripId: string,
    input: CreateTripInput
  ) {
    return fetchJson<TripDashboardData>(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  leaveTrip(tripId: string) {
    return fetchJson<{ ok: true }>(`/api/trips/${tripId}/me`, {
      method: "DELETE",
    });
  },

  closeTrip(tripId: string) {
    return fetchJson<{ ok: true }>(`/api/trips/${tripId}/close`, {
      method: "POST",
    });
  },

  updateAssignment(
    tripId: string,
    memberId: string,
    updates: TripAssignmentUpdates
  ) {
    return fetchJson<TripDashboardData>(
      `/api/trips/${tripId}/assignments/${memberId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
  },
};
