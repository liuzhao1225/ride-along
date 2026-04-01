import {
  assignRide,
  bulkAssignRides,
  clearAssignments,
  createActivity,
  disbandActivity,
  getActivity,
  getParticipantById,
  getParticipants,
  isActivityDisbanded,
  joinActivity,
  leaveActivity,
  listActivitiesForUser,
  updateParticipant,
} from "@/lib/data";
import { optimizeAssignments, optimizeRouteOrder } from "@/lib/matching";
import type { Trip, TripMember } from "@/lib/types";
import { buildTripDashboardData, getDriverPassengers } from "./model";

function ensureOrganizer(userId: string | null | undefined, organizerId: string | null) {
  return Boolean(userId && organizerId && userId === organizerId);
}

function ensureDriverCapacity(
  driverId: string,
  members: TripMember[],
  passengerMemberId?: string
) {
  const driver = members.find((member) => member.id === driverId);
  if (!driver || driver.has_car !== 1) {
    throw new Error("invalid_driver");
  }

  const currentPassengers = getDriverPassengers(driverId, members).filter(
    (member) => member.id !== passengerMemberId
  );
  if (currentPassengers.length >= driver.seats) {
    throw new Error("driver_full");
  }
}

function isLocatableMember(
  member: TripMember
): member is TripMember & { location_lat: number; location_lng: number } {
  return member.location_lat != null && member.location_lng != null;
}

function buildDriverOrderUpdates(
  trip: Trip,
  driver: TripMember,
  members: TripMember[]
) {
  const passengers = getDriverPassengers(driver.id, members).filter(
    (member) => member.has_car === 0
  );
  if (passengers.length === 0) return [];

  if (!isLocatableMember(driver)) {
    return passengers.map((passenger) => ({
      passengerId: passenger.id,
      driverId: driver.id,
      pickupOrder: null,
    }));
  }

  const locatablePassengers = passengers.filter(isLocatableMember);
  const route = optimizeRouteOrder(
    driver,
    locatablePassengers,
    trip.dest_lat,
    trip.dest_lng
  );
  const orderMap = new Map(
    route.orderedPassengerIds.map((passengerId, index) => [passengerId, index + 1])
  );

  return passengers.map((passenger) => ({
    passengerId: passenger.id,
    driverId: driver.id,
    pickupOrder: orderMap.get(passenger.id) ?? null,
  }));
}

async function recomputeDriverOrders(
  trip: Trip,
  members: TripMember[],
  driverIds: Array<string | null | undefined>
) {
  const uniqueDriverIds = [...new Set(driverIds.filter(Boolean))] as string[];
  if (uniqueDriverIds.length === 0) return;

  const updates = uniqueDriverIds.flatMap((driverId) => {
    const driver = members.find(
      (member) => member.id === driverId && member.has_car === 1
    );
    if (!driver) return [];
    return buildDriverOrderUpdates(trip, driver, members);
  });

  if (updates.length > 0) {
    await bulkAssignRides(updates);
  }
}

export async function createTrip(input: {
  userId: string;
  title: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  tripDateIso: string | null;
  organizerDisplayName?: string | null;
}) {
  return createActivity(
    input.userId,
    input.title,
    input.destinationName,
    input.destinationLat,
    input.destinationLng,
    input.tripDateIso,
    input.organizerDisplayName
  );
}

export async function getTripDashboard(tripId: string) {
  const trip = await getActivity(tripId);
  if (!trip) return null;
  const members = await getParticipants(tripId);
  return buildTripDashboardData(trip, members);
}

export async function listTripsForUser(userId: string) {
  return listActivitiesForUser(userId);
}

export async function joinTrip(tripId: string, userId: string, nickname: string) {
  return joinActivity(tripId, userId, nickname);
}

export async function updateMyTripProfile(input: {
  tripId: string;
  userId: string;
  updates: {
    location_name?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    has_car?: number;
    seats?: number;
    nickname?: string;
  };
}) {
  const trip = await getActivity(input.tripId);
  if (!trip) throw new Error("trip_not_found");
  if (isActivityDisbanded(trip)) throw new Error("trip_closed");

  const members = await getParticipants(input.tripId);
  const mine = members.find((member) => member.user_id === input.userId);
  if (!mine) throw new Error("member_not_found");
  return updateParticipant(mine.id, input.updates);
}

export async function autoAssignTrip(tripId: string, userId: string) {
  const dashboard = await getTripDashboard(tripId);
  if (!dashboard) throw new Error("trip_not_found");
  if (!ensureOrganizer(userId, dashboard.trip.created_by)) {
    throw new Error("forbidden");
  }
  if (isActivityDisbanded(dashboard.trip)) {
    throw new Error("trip_closed");
  }

  await clearAssignments(tripId);
  const members = await getParticipants(tripId);
  const result = optimizeAssignments(
    members,
    dashboard.trip.dest_lat,
    dashboard.trip.dest_lng
  );
  if (result.assignments.length > 0) {
    await bulkAssignRides(result.assignments);
  }

  return getTripDashboard(tripId);
}

export async function setTripAssignment(input: {
  tripId: string;
  organizerUserId: string;
  passengerMemberId: string;
  driverMemberId: string | null;
}) {
  const dashboard = await getTripDashboard(input.tripId);
  if (!dashboard) throw new Error("trip_not_found");
  if (!ensureOrganizer(input.organizerUserId, dashboard.trip.created_by)) {
    throw new Error("forbidden");
  }
  if (isActivityDisbanded(dashboard.trip)) {
    throw new Error("trip_closed");
  }

  const passenger = dashboard.members.find(
    (member) => member.id === input.passengerMemberId
  );
  if (!passenger || passenger.has_car === 1) {
    throw new Error("invalid_passenger");
  }

  if (input.driverMemberId != null) {
    ensureDriverCapacity(input.driverMemberId, dashboard.members, passenger.id);
  }

  const previousDriverId = passenger.assigned_driver;
  await assignRide(passenger.id, input.driverMemberId, null);
  const membersAfterUpdate = await getParticipants(input.tripId);
  await recomputeDriverOrders(dashboard.trip, membersAfterUpdate, [
    previousDriverId,
    input.driverMemberId,
  ]);
  return getTripDashboard(input.tripId);
}

export async function closeTrip(tripId: string, userId: string) {
  const result = await disbandActivity(tripId, userId);
  if (!result.ok) {
    throw new Error(result.reason === "forbidden" ? "forbidden" : "trip_not_found");
  }
}

export async function leaveTrip(tripId: string, userId: string) {
  const dashboard = await getTripDashboard(tripId);
  if (!dashboard) throw new Error("trip_not_found");
  if (dashboard.trip.created_by === userId) {
    throw new Error("organizer_cannot_leave");
  }
  await leaveActivity(tripId, userId);
}

export async function getTripMemberByUserId(tripId: string, userId: string) {
  const members = await getParticipants(tripId);
  return members.find((member) => member.user_id === userId) ?? null;
}

export async function getTripMember(memberId: string) {
  return getParticipantById(memberId);
}
