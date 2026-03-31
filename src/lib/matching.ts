import type { Participant } from "./types";

const R = 6371;

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Assignment {
  passengerId: string;
  driverId: string;
}

export function autoAssign(
  participants: Participant[],
  destLat: number,
  destLng: number
): Assignment[] {
  const drivers = participants.filter(
    (p) =>
      p.has_car &&
      p.location_lat != null &&
      p.location_lng != null
  );
  const passengers = participants.filter(
    (p) =>
      !p.has_car &&
      p.assigned_driver == null &&
      p.location_lat != null &&
      p.location_lng != null
  );

  const seatCount = new Map<string, number>();
  for (const d of drivers) {
    const alreadyAssigned = participants.filter(
      (p) => p.assigned_driver === d.id
    ).length;
    seatCount.set(d.id, d.seats - alreadyAssigned);
  }

  type Candidate = { passengerId: string; driverId: string; detour: number };
  const candidates: Candidate[] = [];

  for (const passenger of passengers) {
    for (const driver of drivers) {
      const driverToDest = haversine(
        driver.location_lat!,
        driver.location_lng!,
        destLat,
        destLng
      );
      const driverToPassenger = haversine(
        driver.location_lat!,
        driver.location_lng!,
        passenger.location_lat!,
        passenger.location_lng!
      );
      const passengerToDest = haversine(
        passenger.location_lat!,
        passenger.location_lng!,
        destLat,
        destLng
      );
      const detour = driverToPassenger + passengerToDest - driverToDest;
      candidates.push({
        passengerId: passenger.id,
        driverId: driver.id,
        detour,
      });
    }
  }

  candidates.sort((a, b) => a.detour - b.detour);

  const assigned = new Set<string>();
  const assignments: Assignment[] = [];

  for (const c of candidates) {
    if (assigned.has(c.passengerId)) continue;
    const remaining = seatCount.get(c.driverId) ?? 0;
    if (remaining <= 0) continue;
    assignments.push({ passengerId: c.passengerId, driverId: c.driverId });
    assigned.add(c.passengerId);
    seatCount.set(c.driverId, remaining - 1);
  }

  return assignments;
}
