"use client";

import { useEffect, useState } from "react";
import { CalendarRange, MapPin, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { LocationPicker, type Location } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activitySecondsToDateInput,
  eventDateInputToIso,
} from "@/lib/activity-date";
import type { Trip } from "@/lib/types";
import type { TripDashboardData } from "../types";

export function TripSettingsPanel({
  trip,
  onUpdated,
  onSaved,
  embedded = false,
}: {
  trip: Trip;
  onUpdated: (data?: TripDashboardData) => void;
  onSaved?: () => void;
  embedded?: boolean;
}) {
  const [title, setTitle] = useState(trip.name);
  const [tripDate, setTripDate] = useState(activitySecondsToDateInput(trip.event_at));
  const [destination, setDestination] = useState<Location | null>({
    name: trip.dest_name,
    lat: trip.dest_lat,
    lng: trip.dest_lng,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(trip.name);
    setTripDate(activitySecondsToDateInput(trip.event_at));
    setDestination({
      name: trip.dest_name,
      lat: trip.dest_lat,
      lng: trip.dest_lng,
    });
  }, [trip]);

  const closed = trip.disbanded_at != null;

  async function handleSave() {
    if (!title.trim()) {
      setError("请填写行程名称");
      return;
    }
    if (!destination) {
      setError("请填写目的地");
      return;
    }
    if (!eventDateInputToIso(tripDate)) {
      setError("请输入有效日期");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          destination_name: destination.name,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          trip_date: tripDate,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as
        | TripDashboardData
        | { error?: string };
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "保存失败");
        return;
      }

      toast.success("行程信息已更新");
      onUpdated(json as TripDashboardData);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <>
      {!embedded ? (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PencilLine className="size-4" />
            行程信息
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={embedded ? "space-y-4 p-0 pt-0" : "space-y-4"}>
        {closed ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            行程已关闭，无法修改活动信息。
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="trip-settings-title">行程名称</Label>
          <Input
            id="trip-settings-title"
            value={title}
            disabled={closed}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：周六早上去莫干山"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trip-settings-date">出行日期</Label>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="trip-settings-date"
              type="date"
              className="pl-9"
              value={tripDate}
              disabled={closed}
              onChange={(event) => setTripDate(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>目的地</Label>
          <LocationPicker
            value={destination}
            onChange={setDestination}
            placeholder="搜索目的地..."
            center={[trip.dest_lng, trip.dest_lat]}
            disabled={closed}
          />
        </div>

        {destination ? (
          <p className="text-xs text-muted-foreground">
            <MapPin className="mr-1 inline size-3" />
            当前目的地：{destination.name}
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          className="w-full"
          disabled={closed || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "保存中..." : "保存行程信息"}
        </Button>
      </CardContent>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      {content}
    </Card>
  );
}
