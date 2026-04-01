/* eslint-disable @typescript-eslint/no-explicit-any -- AMap SDK */
"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAMap } from "./amap-loader";
import type { Participant, Activity } from "@/lib/types";
import {
  MAP_DOT_GREEN,
  MAP_DOT_RED,
  createPersonDotElement,
  createPersonStarElement,
  mapDotMarkerOffsetPx,
  MAP_DOT_SCREEN_PX,
  MAP_STAR_SCREEN_PX,
  MAP_STAR_YELLOW,
} from "@/lib/amap-dot-style";

const ROUTE_LINE = "#1677ff";
const DEST_DOT = "#f5222d";
const ROUTE_LINE_MUTED = "#94a3b8";

interface RouteMapProps {
  activity: Activity;
  participants: Participant[];
  myParticipant?: Participant;
  previewDriver?: Participant;
  previewParticipants?: Participant[];
  currentUserId?: string;
  heightClassName?: string;
}

export function RouteMap({
  activity,
  participants,
  myParticipant,
  previewDriver,
  previewParticipants,
  currentUserId,
  heightClassName,
}: RouteMapProps) {
  const { loaded, AMap } = useAMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const drawRequestIdRef = useRef(0);
  /** 用户手动缩放/拖动后不再自动 setFitView，避免轮询重绘把视野拉回全局 */
  const userAdjustedViewRef = useRef(false);
  /** 程序化 setFitView 也会触发 zoom/move 事件，用此标记忽略 */
  const programmaticFitRef = useRef(false);
  const prevActivityIdRef = useRef<string | null>(null);
  const participantsWithPreview = useMemo(
    () =>
      myParticipant
        ? participants.map((participant) =>
            participant.id === myParticipant.id ? myParticipant : participant
          )
        : participants,
    [participants, myParticipant]
  );

  const view = useMemo(() => {
    if (previewDriver) {
      return { kind: "driver_preview" as const, driver: previewDriver };
    }
    if (previewParticipants) {
      return {
        kind: "participants_preview" as const,
        participants: previewParticipants,
      };
    }
    if (!myParticipant) {
      return { kind: "participants_preview" as const, participants: [] };
    }
    if (myParticipant.has_car) {
      return { kind: "driver" as const, driver: myParticipant };
    }
    if (myParticipant.assigned_driver) {
      const driver = participantsWithPreview.find(
        (p) => p.id === myParticipant.assigned_driver
      );
      if (driver) {
        return { kind: "passenger_ride" as const, driver, passenger: myParticipant };
      }
      return { kind: "passenger_ride_missing_driver" as const };
    }
    return { kind: "passenger_waiting" as const, me: myParticipant };
  }, [myParticipant, participantsWithPreview, previewDriver, previewParticipants]);

  const activeDriver =
    view.kind === "passenger_waiting" ||
    view.kind === "passenger_ride_missing_driver" ||
    view.kind === "participants_preview"
      ? null
      : view.driver;

  const waitingParticipant = view.kind === "passenger_waiting" ? view.me : null;
  const previewMembers =
    view.kind === "participants_preview" ? view.participants : null;

  const effectiveCurrentUserId = currentUserId ?? myParticipant?.user_id;

  const clearOverlays = useCallback(() => {
    for (const o of overlaysRef.current) {
      if (mapRef.current) {
        mapRef.current.remove(o);
      }
    }
    overlaysRef.current = [];
  }, []);

  /** 仅在用户尚未手动调整视野时自动适配全览，避免与 userAdjustedViewRef 冲突 */
  const fitMapIfNeeded = useCallback((map: any, delayMs: number) => {
    setTimeout(() => {
      if (userAdjustedViewRef.current) return;
      if (mapRef.current !== map) return;
      if (map && overlaysRef.current.length > 0) {
        programmaticFitRef.current = true;
        map.setFitView(overlaysRef.current, false, [40, 40, 40, 40]);
        window.setTimeout(() => {
          programmaticFitRef.current = false;
        }, 700);
      }
    }, delayMs);
  }, []);

  const handleFitViewClick = useCallback(() => {
    const map = mapRef.current;
    if (!map || overlaysRef.current.length === 0) return;
    programmaticFitRef.current = true;
    map.setFitView(overlaysRef.current, false, [40, 40, 40, 40]);
    window.setTimeout(() => {
      programmaticFitRef.current = false;
    }, 700);
  }, []);

  const addPersonDot = useCallback(
    (
      map: any,
      lng: number,
      lat: number,
      kind: "green" | "red",
      markerStyle: "dot" | "star" = "dot"
    ) => {
      if (!AMap) return;
      const color =
        markerStyle === "star"
          ? MAP_STAR_YELLOW
          : kind === "green"
            ? MAP_DOT_GREEN
            : MAP_DOT_RED;
      const el =
        markerStyle === "star"
          ? createPersonStarElement(color)
          : createPersonDotElement(color);
      const [ox, oy] = mapDotMarkerOffsetPx(
        markerStyle === "star" ? MAP_STAR_SCREEN_PX : MAP_DOT_SCREEN_PX
      );
      const marker = new AMap.Marker({
        position: [lng, lat],
        map,
        content: el,
        offset: new AMap.Pixel(ox, oy),
      });
      overlaysRef.current.push(marker);
    },
    [AMap]
  );

  const getMarkerStyle = useCallback(
    (participant?: Pick<Participant, "user_id"> | null) =>
      participant?.user_id != null && participant.user_id === effectiveCurrentUserId
        ? "star"
        : "dot",
    [effectiveCurrentUserId]
  );

  const drawPathSegments = useCallback(
    (
      map: any,
      requestId: number,
      segments: Array<{
        start: [number, number];
        end: [number, number];
        color: string;
      }>
    ) => {
      if (!AMap || segments.length === 0) {
        fitMapIfNeeded(map, 300);
        return;
      }

      let remaining = segments.length;
      for (const segment of segments) {
        const driving = new AMap.Driving({
          map: null,
          policy: 0,
        });

        driving.search(
          new AMap.LngLat(segment.start[0], segment.start[1]),
          new AMap.LngLat(segment.end[0], segment.end[1]),
          (_status: string, result: any) => {
            if (drawRequestIdRef.current !== requestId || mapRef.current !== map) {
              return;
            }

            if (result?.routes?.length > 0) {
              const path: any[] = [];
              for (const step of result.routes[0].steps ?? []) {
                path.push(...step.path);
              }
              if (path.length > 0) {
                const polyline = new AMap.Polyline({
                  path,
                  strokeColor: segment.color,
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                  map,
                });
                overlaysRef.current.push(polyline);
              }
            }

            remaining -= 1;
            if (remaining === 0) {
              fitMapIfNeeded(map, 500);
            }
          }
        );
      }
    },
    [AMap, fitMapIfNeeded]
  );

  const addDestDot = useCallback(
    (map: any) => {
      if (!AMap) return;
      const el = createPersonDotElement(DEST_DOT);
      const [ox, oy] = mapDotMarkerOffsetPx();
      const marker = new AMap.Marker({
        position: [activity.dest_lng, activity.dest_lat],
        map,
        content: el,
        offset: new AMap.Pixel(ox, oy),
      });
      overlaysRef.current.push(marker);
    },
    [AMap, activity.dest_lat, activity.dest_lng]
  );

  // routeDataSig 已编码地图相关数据；不把 activity/participants 引用放进 deps，避免父级轮询导致反复 clear+fit
  const drawRoutes = useCallback(() => {
    if (!AMap || !mapRef.current) return;
    const requestId = drawRequestIdRef.current + 1;
    drawRequestIdRef.current = requestId;
    clearOverlays();
    const map = mapRef.current;

    addDestDot(map);

    if (view.kind === "passenger_ride_missing_driver") {
      fitMapIfNeeded(map, 300);
      return;
    }

    if (view.kind === "passenger_waiting") {
      const me = waitingParticipant;
      if (!me) return;
      if (me.location_lat != null && me.location_lng != null) {
        addPersonDot(
          map,
          me.location_lng,
          me.location_lat,
          "red",
          getMarkerStyle(me)
        );
      }
      fitMapIfNeeded(map, 300);
      return;
    }

    if (view.kind === "participants_preview") {
      for (const participant of previewMembers ?? []) {
        if (participant.location_lat != null && participant.location_lng != null) {
          addPersonDot(
            map,
            participant.location_lng,
            participant.location_lat,
            "red",
            getMarkerStyle(participant)
          );
        }
      }
      fitMapIfNeeded(map, 300);
      return;
    }

    const driver = activeDriver;
    if (!driver) return;

    if (driver.location_lat == null || driver.location_lng == null) {
      fitMapIfNeeded(map, 300);
      return;
    }

    addPersonDot(
      map,
      driver.location_lng,
      driver.location_lat,
      "green",
      getMarkerStyle(driver)
    );

    const passengers = participantsWithPreview
      .filter((p) => p.assigned_driver === driver.id && p.location_lat != null)
      .sort((left, right) => {
        const leftOrder = left.pickup_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.pickup_order ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.created_at - right.created_at;
      });

    for (const p of passengers) {
      addPersonDot(
        map,
        p.location_lng!,
        p.location_lat!,
        "green",
        getMarkerStyle(p)
      );
    }

    const passengerRideIndex =
      view.kind === "passenger_ride"
        ? passengers.findIndex((p) => p.id === view.passenger.id)
        : -1;

    const stops: Array<[number, number]> = [
      [driver.location_lng, driver.location_lat],
      ...passengers.map((p) => [p.location_lng!, p.location_lat!] as [number, number]),
      [activity.dest_lng, activity.dest_lat],
    ];

    const segments = stops.slice(0, -1).map((start, index) => ({
      start,
      end: stops[index + 1],
      color:
        passengerRideIndex >= 0 && index < passengerRideIndex
          ? ROUTE_LINE_MUTED
          : ROUTE_LINE,
    }));

    drawPathSegments(map, requestId, segments);
  }, [
    AMap,
    activity.dest_lat,
    activity.dest_lng,
    clearOverlays,
    addDestDot,
    addPersonDot,
    drawPathSegments,
    fitMapIfNeeded,
    getMarkerStyle,
    participantsWithPreview,
    view,
    activeDriver,
    waitingParticipant,
    previewMembers,
  ]);

  useEffect(() => {
    if (!loaded || !AMap || !containerRef.current) return;

    if (prevActivityIdRef.current !== activity.id) {
      prevActivityIdRef.current = activity.id;
      userAdjustedViewRef.current = false;
    }

    if (!mapRef.current) {
      mapRef.current = new AMap.Map(containerRef.current, {
        zoom: 12,
        center: [activity.dest_lng, activity.dest_lat],
      });
      const map = mapRef.current;
      const markUserAdjusted = () => {
        if (programmaticFitRef.current) return;
        userAdjustedViewRef.current = true;
      };
      map.on("zoomend", markUserAdjusted);
      map.on("moveend", markUserAdjusted);
    }

    drawRoutes();
  }, [loaded, AMap, activity.id, activity.dest_lat, activity.dest_lng, drawRoutes]);

  const hint = useMemo(() => {
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
  }, [view, myParticipant]);

  if (!loaded) {
    return (
      <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        地图加载中...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <div className="relative w-full">
        <div
          ref={containerRef}
          className={`w-full rounded-lg border ${heightClassName ?? "h-64 sm:h-80"}`}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2 z-10 h-8 gap-1 border bg-background/95 shadow-sm backdrop-blur-sm"
          onClick={handleFitViewClick}
        >
          <Maximize2 className="size-3.5" />
          全览
        </Button>
      </div>
    </div>
  );
}
