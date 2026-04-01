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

type LocatableParticipant = Participant & {
  location_lat: number;
  location_lng: number;
};

export interface RideAssignment {
  passengerId: string;
  driverId: string;
  pickupOrder: number | null;
}

export interface RouteOptimizationResult {
  orderedPassengerIds: string[];
  routeCost: number;
  detourCost: number;
}

export interface AssignmentOptimizationResult {
  assignments: RideAssignment[];
  stats: {
    assignedCount: number;
    unassignedCount: number;
    totalDetour: number;
    maxDriverDetour: number;
  };
}

interface RouteCacheEntry {
  orderedPassengerIndexes: number[];
  routeCost: number;
  detourCost: number;
}

interface DriverNode {
  id: string;
  lat: number;
  lng: number;
  seats: number;
  directToDest: number;
}

interface PassengerNode {
  id: string;
  lat: number;
  lng: number;
}

interface AssignmentSearchResult {
  assignedCount: number;
  totalDetour: number;
  maxDriverDetour: number;
  chosenSubsets: number[];
}

function countBits(mask: number): number {
  let count = 0;
  let value = mask;
  while (value !== 0) {
    value &= value - 1;
    count += 1;
  }
  return count;
}

function compareSolutions(
  left: {
    assignedCount: number;
    totalDetour: number;
    maxDriverDetour: number;
  },
  right: {
    assignedCount: number;
    totalDetour: number;
    maxDriverDetour: number;
  }
) {
  if (left.assignedCount !== right.assignedCount) {
    return left.assignedCount - right.assignedCount;
  }
  if (left.totalDetour !== right.totalDetour) {
    return right.totalDetour - left.totalDetour;
  }
  if (left.maxDriverDetour !== right.maxDriverDetour) {
    return right.maxDriverDetour - left.maxDriverDetour;
  }
  return 0;
}

function optimizeRouteOrderByCoordinates(
  driverLat: number,
  driverLng: number,
  passengers: PassengerNode[],
  destLat: number,
  destLng: number
): RouteCacheEntry {
  const directToDest = haversine(driverLat, driverLng, destLat, destLng);

  if (passengers.length === 0) {
    return {
      orderedPassengerIndexes: [],
      routeCost: directToDest,
      detourCost: 0,
    };
  }

  const count = passengers.length;
  const startTo = Array.from({ length: count }, (_, index) =>
    haversine(driverLat, driverLng, passengers[index].lat, passengers[index].lng)
  );
  const toDest = Array.from({ length: count }, (_, index) =>
    haversine(passengers[index].lat, passengers[index].lng, destLat, destLng)
  );
  const between = Array.from({ length: count }, (_, fromIndex) =>
    Array.from({ length: count }, (_, toIndex) =>
      fromIndex === toIndex
        ? 0
        : haversine(
            passengers[fromIndex].lat,
            passengers[fromIndex].lng,
            passengers[toIndex].lat,
            passengers[toIndex].lng
          )
    )
  );

  const fullMask = (1 << count) - 1;
  const dp = Array.from({ length: 1 << count }, () =>
    Array.from({ length: count }, () => Number.POSITIVE_INFINITY)
  );
  const prev = Array.from({ length: 1 << count }, () =>
    Array.from({ length: count }, () => -1)
  );

  for (let index = 0; index < count; index += 1) {
    dp[1 << index][index] = startTo[index];
  }

  for (let mask = 1; mask <= fullMask; mask += 1) {
    for (let last = 0; last < count; last += 1) {
      if ((mask & (1 << last)) === 0) continue;
      const prevMask = mask ^ (1 << last);
      if (prevMask === 0) continue;

      for (let prevIndex = 0; prevIndex < count; prevIndex += 1) {
        if ((prevMask & (1 << prevIndex)) === 0) continue;
        const nextCost = dp[prevMask][prevIndex] + between[prevIndex][last];
        if (nextCost < dp[mask][last]) {
          dp[mask][last] = nextCost;
          prev[mask][last] = prevIndex;
        }
      }
    }
  }

  let bestCost = Number.POSITIVE_INFINITY;
  let bestLast = -1;

  for (let last = 0; last < count; last += 1) {
    const totalCost = dp[fullMask][last] + toDest[last];
    if (totalCost < bestCost) {
      bestCost = totalCost;
      bestLast = last;
    }
  }

  const orderedPassengerIndexes: number[] = [];
  let mask = fullMask;
  let current = bestLast;

  while (current !== -1) {
    orderedPassengerIndexes.push(current);
    const prevIndex = prev[mask][current];
    mask ^= 1 << current;
    current = prevIndex;
  }

  orderedPassengerIndexes.reverse();

  return {
    orderedPassengerIndexes,
    routeCost: bestCost,
    detourCost: Math.max(0, bestCost - directToDest),
  };
}

export function optimizeRouteOrder(
  driver: Pick<LocatableParticipant, "location_lat" | "location_lng">,
  passengers: Array<Pick<LocatableParticipant, "id" | "location_lat" | "location_lng">>,
  destLat: number,
  destLng: number
): RouteOptimizationResult {
  const route = optimizeRouteOrderByCoordinates(
    driver.location_lat,
    driver.location_lng,
    passengers.map((passenger) => ({
      id: passenger.id,
      lat: passenger.location_lat,
      lng: passenger.location_lng,
    })),
    destLat,
    destLng
  );

  return {
    orderedPassengerIds: route.orderedPassengerIndexes.map(
      (index) => passengers[index].id
    ),
    routeCost: route.routeCost,
    detourCost: route.detourCost,
  };
}

function createSubsetEnumerator() {
  const cache = new Map<string, number[]>();

  return function enumerateSubsets(mask: number, limit: number) {
    const key = `${mask}:${limit}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const bits: number[] = [];
    for (let bit = 0; bit < 31; bit += 1) {
      if ((mask & (1 << bit)) !== 0) {
        bits.push(bit);
      }
    }

    const subsets = new Set<number>([0]);

    function dfs(startIndex: number, remaining: number, subset: number) {
      if (remaining === 0) return;
      for (let index = startIndex; index < bits.length; index += 1) {
        const nextSubset = subset | (1 << bits[index]);
        subsets.add(nextSubset);
        dfs(index + 1, remaining - 1, nextSubset);
      }
    }

    dfs(0, limit, 0);

    const result = [...subsets].sort((left, right) => {
      const bySize = countBits(right) - countBits(left);
      return bySize !== 0 ? bySize : left - right;
    });

    cache.set(key, result);
    return result;
  };
}

export function optimizeAssignments(
  participants: Participant[],
  destLat: number,
  destLng: number
): AssignmentOptimizationResult {
  const drivers: DriverNode[] = participants
    .filter(
      (participant): participant is LocatableParticipant =>
        participant.has_car === 1 &&
        participant.seats > 0 &&
        participant.location_lat != null &&
        participant.location_lng != null
    )
    .map((driver) => ({
      id: driver.id,
      lat: driver.location_lat,
      lng: driver.location_lng,
      seats: driver.seats,
      directToDest: haversine(
        driver.location_lat,
        driver.location_lng,
        destLat,
        destLng
      ),
    }));

  const passengers: PassengerNode[] = participants
    .filter(
      (participant): participant is LocatableParticipant =>
        participant.has_car === 0 &&
        participant.assigned_driver == null &&
        participant.location_lat != null &&
        participant.location_lng != null
    )
    .map((passenger) => ({
      id: passenger.id,
      lat: passenger.location_lat,
      lng: passenger.location_lng,
    }));

  if (drivers.length === 0 || passengers.length === 0) {
    return {
      assignments: [],
      stats: {
        assignedCount: 0,
        unassignedCount: passengers.length,
        totalDetour: 0,
        maxDriverDetour: 0,
      },
    };
  }

  const enumerateSubsets = createSubsetEnumerator();
  const routeCache = drivers.map(() => new Map<number, RouteCacheEntry>());

  function getRouteData(driverIndex: number, subsetMask: number) {
    const driverCache = routeCache[driverIndex];
    const cached = driverCache.get(subsetMask);
    if (cached) return cached;

    const driver = drivers[driverIndex];
    const subsetPassengers = passengers.filter(
      (_passenger, passengerIndex) => (subsetMask & (1 << passengerIndex)) !== 0
    );
    const route = optimizeRouteOrderByCoordinates(
      driver.lat,
      driver.lng,
      subsetPassengers,
      destLat,
      destLng
    );

    const mappedRoute: RouteCacheEntry = {
      ...route,
      orderedPassengerIndexes: route.orderedPassengerIndexes.map((localIndex) => {
        const subsetIndexes = passengers
          .map((_passenger, passengerIndex) => passengerIndex)
          .filter((passengerIndex) => (subsetMask & (1 << passengerIndex)) !== 0);
        return subsetIndexes[localIndex];
      }),
    };

    driverCache.set(subsetMask, mappedRoute);
    return mappedRoute;
  }

  const memo = new Map<string, AssignmentSearchResult>();

  function solve(
    driverIndex: number,
    availableMask: number
  ): AssignmentSearchResult {
    const key = `${driverIndex}:${availableMask}`;
    const cached = memo.get(key);
    if (cached) return cached;

    if (driverIndex >= drivers.length || availableMask === 0) {
      const result: AssignmentSearchResult = {
        assignedCount: 0,
        totalDetour: 0,
        maxDriverDetour: 0,
        chosenSubsets: [],
      };
      memo.set(key, result);
      return result;
    }

    const driver = drivers[driverIndex];
    const candidateSubsets = enumerateSubsets(
      availableMask,
      Math.min(driver.seats, countBits(availableMask))
    );

    let best: AssignmentSearchResult | null = null;

    for (const subsetMask of candidateSubsets) {
      const route = getRouteData(driverIndex, subsetMask);
      const next = solve(driverIndex + 1, availableMask & ~subsetMask);
      const candidate = {
        assignedCount: countBits(subsetMask) + next.assignedCount,
        totalDetour: route.detourCost + next.totalDetour,
        maxDriverDetour: Math.max(route.detourCost, next.maxDriverDetour),
        chosenSubsets: [subsetMask, ...next.chosenSubsets],
      };

      if (
        !best ||
        compareSolutions(candidate, best) > 0
      ) {
        best = candidate;
      }
    }

    const resolved: AssignmentSearchResult =
      best ?? {
        assignedCount: 0,
        totalDetour: 0,
        maxDriverDetour: 0,
        chosenSubsets: [],
      };
    memo.set(key, resolved);
    return resolved;
  }

  const fullMask = (1 << passengers.length) - 1;
  const best = solve(0, fullMask);
  const assignments: RideAssignment[] = [];

  best.chosenSubsets.forEach((subsetMask, driverIndex) => {
    if (subsetMask === 0) return;
    const route = getRouteData(driverIndex, subsetMask);
    route.orderedPassengerIndexes.forEach((passengerIndex, index) => {
      assignments.push({
        passengerId: passengers[passengerIndex].id,
        driverId: drivers[driverIndex].id,
        pickupOrder: index + 1,
      });
    });
  });

  return {
    assignments,
    stats: {
      assignedCount: best.assignedCount,
      unassignedCount: passengers.length - best.assignedCount,
      totalDetour: best.totalDetour,
      maxDriverDetour: best.maxDriverDetour,
    },
  };
}
