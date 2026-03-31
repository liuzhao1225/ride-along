import type { Trip, TripMember } from "@/lib/types";

export type TripStatus = "collecting" | "assigned" | "closed";

export interface TripStats {
  totalMembers: number;
  completedProfiles: number;
  drivers: number;
  availableSeats: number;
  assignedPassengers: number;
  unassignedPassengers: number;
}

export interface TripDashboardData {
  trip: Trip;
  members: TripMember[];
  status: TripStatus;
  stats: TripStats;
}
