import {
  assignRide,
  bulkAssignRides,
  clearAutoAssignableAssignments,
  createActivity,
  disbandActivity,
  getActivity,
  getParticipantById,
  getParticipants,
  isActivityDisbanded,
  joinActivity,
  leaveActivity,
  listActivitiesForUser,
  updateActivity,
  updateParticipant,
} from "@/lib/data";
import { optimizeAssignments, optimizeRouteOrder } from "@/lib/matching";
import type { Trip, TripMember } from "@/lib/types";
import {
  buildTripDashboardData,
  getDriverPassengers,
  isTripProfileComplete,
} from "./model";

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

export async function updateTrip(input: {
  tripId: string;
  userId: string;
  updates: {
    title?: string;
    destinationName?: string;
    destinationLat?: number;
    destinationLng?: number;
    tripDateIso?: string | null;
  };
}) {
  const trip = await getActivity(input.tripId);
  if (!trip) throw new Error("trip_not_found");
  if (trip.created_by !== input.userId) throw new Error("forbidden");
  if (isActivityDisbanded(trip)) throw new Error("trip_closed");

  await updateActivity(input.tripId, input.userId, {
    name: input.updates.title,
    dest_name: input.updates.destinationName,
    dest_lat: input.updates.destinationLat,
    dest_lng: input.updates.destinationLng,
    event_at: input.updates.tripDateIso,
  });

  return getTripDashboard(input.tripId);
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
  const mergedProfile = {
    ...mine,
    ...input.updates,
  };
  if (!isTripProfileComplete(mergedProfile)) {
    throw new Error("location_required");
  }
  return updateParticipant(mine.id, input.updates);
}

export async function autoAssignTrip(input: {
  tripId: string;
  userId: string;
  releaseSelf?: boolean;
}) {
  const { tripId, userId, releaseSelf = true } = input;
  const dashboard = await getTripDashboard(tripId);
  if (!dashboard) throw new Error("trip_not_found");
  if (isActivityDisbanded(dashboard.trip)) {
    throw new Error("trip_closed");
  }

  const currentMember = dashboard.members.find((member) => member.user_id === userId);
  if (!currentMember) {
    throw new Error("forbidden");
  }

  if (
    releaseSelf &&
    currentMember.has_car === 0 &&
    !currentMember.is_free_agent
  ) {
    await updateParticipant(currentMember.id, { is_free_agent: true });
  }

  await clearAutoAssignableAssignments(tripId);
  const members = await getParticipants(tripId);
  const result = optimizeAssignments(
    members,
    dashboard.trip.dest_lat,
    dashboard.trip.dest_lng
  );
  if (result.assignments.length > 0) {
    await bulkAssignRides(result.assignments);
  }

  const membersAfterAssignments = await getParticipants(tripId);
  await recomputeDriverOrders(
    dashboard.trip,
    membersAfterAssignments,
    membersAfterAssignments
      .filter((member) => member.has_car === 1)
      .map((member) => member.id)
  );

  return getTripDashboard(tripId);
}

export async function setTripAssignment(input: {
  tripId: string;
  actorUserId: string;
  passengerMemberId: string;
  driverMemberId: string | null;
}) {
  const dashboard = await getTripDashboard(input.tripId);
  if (!dashboard) throw new Error("trip_not_found");
  if (isActivityDisbanded(dashboard.trip)) {
    throw new Error("trip_closed");
  }

  const actorMember = dashboard.members.find(
    (member) => member.user_id === input.actorUserId
  );
  const isOrganizer = ensureOrganizer(input.actorUserId, dashboard.trip.created_by);
  if (!isOrganizer && !actorMember) {
    throw new Error("forbidden");
  }

  const passenger = dashboard.members.find(
    (member) => member.id === input.passengerMemberId
  );
  if (!passenger || passenger.has_car === 1) {
    throw new Error("invalid_passenger");
  }

  const previousDriverId = passenger.assigned_driver;
  const isSelfAction = passenger.user_id === input.actorUserId;
  const isDriverOwnerRemoving =
    input.driverMemberId == null &&
    actorMember?.has_car === 1 &&
    previousDriverId === actorMember.id;

  if (!isOrganizer && !isSelfAction && !isDriverOwnerRemoving) {
    throw new Error("forbidden");
  }

  if (input.driverMemberId != null && !isOrganizer && !isSelfAction) {
    throw new Error("forbidden");
  }

  if (input.driverMemberId != null) {
    ensureDriverCapacity(input.driverMemberId, dashboard.members, passenger.id);
  }

  await assignRide(
    passenger.id,
    input.driverMemberId,
    null,
    isSelfAction ? false : undefined
  );
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
