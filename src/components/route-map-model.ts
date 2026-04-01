import type { Participant } from "@/lib/types";

export type RouteMapView =
  | { kind: "driver_preview"; driver: Participant }
  | { kind: "participants_preview"; participants: Participant[] }
  | { kind: "driver"; driver: Participant }
  | { kind: "passenger_ride"; driver: Participant; passenger: Participant }
  | { kind: "passenger_ride_missing_driver" }
  | { kind: "passenger_waiting"; me: Participant };

export function resolveRouteMapView(input: {
  myParticipant?: Participant;
  previewDriver?: Participant;
  previewParticipants?: Participant[];
  participants: Participant[];
}) {
  const { myParticipant, previewDriver, previewParticipants, participants } = input;

  if (previewDriver) {
    return { kind: "driver_preview", driver: previewDriver } satisfies RouteMapView;
  }
  if (previewParticipants) {
    return {
      kind: "participants_preview",
      participants: previewParticipants,
    } satisfies RouteMapView;
  }
  if (!myParticipant) {
    return {
      kind: "participants_preview",
      participants: [],
    } satisfies RouteMapView;
  }
  if (myParticipant.has_car) {
    return { kind: "driver", driver: myParticipant } satisfies RouteMapView;
  }
  if (myParticipant.assigned_driver) {
    const driver = participants.find(
      (participant) => participant.id === myParticipant.assigned_driver
    );
    if (driver) {
      return {
        kind: "passenger_ride",
        driver,
        passenger: myParticipant,
      } satisfies RouteMapView;
    }
    return { kind: "passenger_ride_missing_driver" } satisfies RouteMapView;
  }
  return { kind: "passenger_waiting", me: myParticipant } satisfies RouteMapView;
}

export function buildRouteMapHint(
  view: RouteMapView,
  myParticipant: Participant | undefined
) {
  if (view.kind === "passenger_waiting") {
    if (!myParticipant) return null;
    return myParticipant.location_lat == null
      ? "你尚未设置出发地；上车前仅显示目的地。设置出发地后将显示红点。"
      : "尚未分配车辆：不显示驾车路线，红点为你的出发位置。";
  }
  if (view.kind === "driver_preview") {
    return view.driver.location_lat == null ||
      view.driver.location_lng == null
      ? "车主尚未设置出发地，暂时无法显示驾车路线。"
      : null;
  }
  if (view.kind === "participants_preview") {
    const locatedCount =
      view.participants.filter(
        (participant) =>
          participant.location_lat != null && participant.location_lng != null
      ).length;
    return locatedCount > 0
      ? "红点为当前未分组成员的出发位置。"
      : "未分组成员暂未设置出发地，地图仅显示目的地。";
  }
  if (view.kind === "driver") {
    if (!myParticipant) return null;
    return myParticipant.location_lat == null ||
      myParticipant.location_lng == null
      ? "请先在「我的信息」中设置出发地，即可查看驾车路线。"
      : null;
  }
  if (view.kind === "passenger_ride") {
    return view.driver.location_lat == null ||
      view.driver.location_lng == null
      ? "司机尚未设置出发地，暂时无法显示驾车路线。"
      : null;
  }
  return null;
}

export function getDisplayPassengersForDriver(
  driverId: string,
  participants: Participant[]
) {
  return participants
    .filter((participant) => participant.assigned_driver === driverId)
    .filter((participant) => participant.location_lat != null)
    .sort((left, right) => {
      const leftOrder = left.pickup_order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.pickup_order ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.created_at - right.created_at;
    });
}

export function getPassengerRideIndex(
  view: RouteMapView,
  passengers: Participant[]
) {
  if (view.kind !== "passenger_ride") {
    return -1;
  }

  return passengers.findIndex((passenger) => passenger.id === view.passenger.id);
}

export function buildRouteStops(
  destinationLat: number,
  destinationLng: number,
  driver: Participant,
  passengers: Participant[]
) {
  return [
    [driver.location_lng!, driver.location_lat!] as [number, number],
    ...passengers.map((passenger) => [
      passenger.location_lng!,
      passenger.location_lat!,
    ] as [number, number]),
    [destinationLng, destinationLat] as [number, number],
  ];
}
