import type { TripMember, Trip } from "@/lib/types";
import type { TripDashboardData, TripStats, TripStatus } from "./types";

export function getTripStatus(trip: Trip, members: TripMember[]): TripStatus {
  if (trip.disbanded_at != null) return "closed";
  const hasAssignments = members.some((member) => member.assigned_driver != null);
  return hasAssignments ? "assigned" : "collecting";
}

export function getTripStats(members: TripMember[]): TripStats {
  const drivers = members.filter((member) => member.has_car === 1);
  const passengers = members.filter((member) => member.has_car === 0);
  const assignedPassengers = passengers.filter(
    (member) => member.assigned_driver != null
  ).length;

  return {
    totalMembers: members.length,
    completedProfiles: members.filter(
      (member) => member.location_lat != null && member.location_lng != null
    ).length,
    drivers: drivers.length,
    availableSeats: drivers.reduce((sum, driver) => sum + driver.seats, 0),
    assignedPassengers,
    unassignedPassengers: passengers.length - assignedPassengers,
  };
}

export function buildTripDashboardData(
  trip: Trip,
  members: TripMember[]
): TripDashboardData {
  return {
    trip,
    members,
    status: getTripStatus(trip, members),
    stats: getTripStats(members),
  };
}

export function getMyRide(
  myMember: TripMember | undefined,
  members: TripMember[]
): TripMember | null {
  if (!myMember?.assigned_driver) return null;
  return members.find((member) => member.id === myMember.assigned_driver) ?? null;
}

export function getDrivers(members: TripMember[]) {
  return members.filter((member) => member.has_car === 1);
}

export function getPassengers(members: TripMember[]) {
  return members.filter((member) => member.has_car === 0);
}

export function getUnassignedPassengers(members: TripMember[]) {
  return getPassengers(members).filter((member) => member.assigned_driver == null);
}

export function getDriverPassengers(
  driverId: string,
  members: TripMember[]
): TripMember[] {
  return members.filter((member) => member.assigned_driver === driverId);
}
