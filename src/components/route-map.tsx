"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAMap } from "./amap-loader";
import type { Participant, Activity } from "@/lib/db";

const DRIVER_COLORS = [
  "#1677ff",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#722ed1",
  "#13c2c2",
  "#f5222d",
  "#2f54eb",
];

interface RouteMapProps {
  activity: Activity;
  participants: Participant[];
  currentUserId?: string;
}

export function RouteMap({
  activity,
  participants,
  currentUserId,
}: RouteMapProps) {
  const { loaded, AMap, loadError } = useAMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const clearOverlays = useCallback(() => {
    for (const o of overlaysRef.current) {
      if (mapRef.current) {
        mapRef.current.remove(o);
      }
    }
    overlaysRef.current = [];
  }, []);

  const drawRoutes = useCallback(() => {
    if (!AMap || !mapRef.current) return;
    clearOverlays();
    const map = mapRef.current;

    const destMarker = new AMap.Marker({
      position: [activity.dest_lng, activity.dest_lat],
      map,
      label: {
        content: `<div style="background:#f5222d;color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;">目的地: ${activity.dest_name}</div>`,
        direction: "top",
      },
      icon: new AMap.Icon({
        size: new AMap.Size(25, 34),
        image:
          "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png",
        imageSize: new AMap.Size(25, 34),
      }),
    });
    overlaysRef.current.push(destMarker);

    const drivers = participants.filter((p) => p.has_car);
    const drivingInstances: any[] = [];

    drivers.forEach((driver, idx) => {
      if (driver.location_lat == null || driver.location_lng == null) return;
      const color = DRIVER_COLORS[idx % DRIVER_COLORS.length];

      const driverMarker = new AMap.Marker({
        position: [driver.location_lng, driver.location_lat],
        map,
        label: {
          content: `<div style="background:${color};color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap;">${driver.nickname} (司机)</div>`,
          direction: "top",
        },
      });
      overlaysRef.current.push(driverMarker);

      const passengers = participants.filter(
        (p) => p.assigned_driver === driver.id && p.location_lat != null
      );

      for (const p of passengers) {
        const pMarker = new AMap.Marker({
          position: [p.location_lng!, p.location_lat!],
          map,
          label: {
            content: `<div style="background:${color};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;opacity:0.85;white-space:nowrap;">${p.nickname}</div>`,
            direction: "top",
          },
          icon: new AMap.Icon({
            size: new AMap.Size(19, 31),
            image:
              "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
            imageSize: new AMap.Size(19, 31),
          }),
        });
        overlaysRef.current.push(pMarker);
      }

      const waypoints = passengers
        .filter((p) => p.location_lng != null)
        .map((p) => new AMap.LngLat(p.location_lng!, p.location_lat!));

      const driving = new AMap.Driving({
        map: null,
        policy: 0,
      });
      drivingInstances.push(driving);

      driving.search(
        new AMap.LngLat(driver.location_lng, driver.location_lat),
        new AMap.LngLat(activity.dest_lng, activity.dest_lat),
        { waypoints },
        (status: string, result: any) => {
          if (status === "complete" && result.routes?.length > 0) {
            const route = result.routes[0];
            const path: any[] = [];
            for (const step of route.steps) {
              path.push(...step.path);
            }
            const polyline = new AMap.Polyline({
              path,
              strokeColor: color,
              strokeWeight: 5,
              strokeOpacity: 0.8,
              map,
            });
            overlaysRef.current.push(polyline);
          }
        }
      );
    });

    // Unassigned passengers
    const unassigned = participants.filter(
      (p) =>
        !p.has_car &&
        !p.assigned_driver &&
        p.location_lat != null
    );
    for (const p of unassigned) {
      const isMe = p.user_id === currentUserId;
      const pMarker = new AMap.Marker({
        position: [p.location_lng!, p.location_lat!],
        map,
        label: {
          content: `<div style="background:#999;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;white-space:nowrap;">${p.nickname}${isMe ? " (我)" : ""}</div>`,
          direction: "top",
        },
        icon: new AMap.Icon({
          size: new AMap.Size(19, 31),
          image:
            "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
          imageSize: new AMap.Size(19, 31),
        }),
      });
      overlaysRef.current.push(pMarker);
    }

    // Fit view
    setTimeout(() => {
      if (map && overlaysRef.current.length > 0) {
        map.setFitView(overlaysRef.current, false, [40, 40, 40, 40]);
      }
    }, 500);
  }, [AMap, activity, participants, currentUserId, clearOverlays]);

  useEffect(() => {
    if (!loaded || !AMap || !containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = new AMap.Map(containerRef.current, {
        zoom: 12,
        center: [activity.dest_lng, activity.dest_lat],
      });
    }
    drawRoutes();
  }, [loaded, AMap, drawRoutes, activity.dest_lng, activity.dest_lat]);

  if (!loaded) {
    return (
      <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        地图加载中...
      </div>
    );
  }

  if (!AMap) {
    return (
      <div className="w-full h-64 rounded-lg border border-dashed bg-muted/50 flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <span>地图不可用</span>
        <span className="text-xs">{loadError ?? "请检查 NEXT_PUBLIC_AMAP_KEY 与网络"}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-64 sm:h-80 rounded-lg border"
    />
  );
}
