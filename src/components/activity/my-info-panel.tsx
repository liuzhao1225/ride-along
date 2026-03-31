"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocationPicker, type Location } from "@/components/location-picker";
import { RouteMap } from "@/components/route-map";
import { useActivityData } from "@/contexts/activity-data-context";
import { Car, UserRound, Minus, Plus } from "lucide-react";
import type { Activity, Participant } from "@/lib/types";

export function MyInfoPanel({
  participant,
  activityId,
  onUpdated,
  destCenter,
  activity,
  participants,
  currentUserId,
}: {
  participant: Participant;
  activityId: string;
  onUpdated: () => void;
  destCenter: [number, number];
  activity: Activity;
  participants: Participant[];
  currentUserId: string;
}) {
  const { isCreator, disbanding, disbandActivity } = useActivityData();

  const [location, setLocation] = useState<Location | null>(
    participant.location_lat != null
      ? {
          name: participant.location_name || "已选择",
          lat: participant.location_lat,
          lng: participant.location_lng!,
        }
      : null
  );
  const [hasCar, setHasCar] = useState(!!participant.has_car);
  const [seats, setSeats] = useState(participant.seats || 4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocation(
      participant.location_lat != null
        ? {
            name: participant.location_name || "已选择",
            lat: participant.location_lat,
            lng: participant.location_lng!,
          }
        : null
    );
    setHasCar(!!participant.has_car);
    setSeats(participant.seats || 4);
  }, [
    participant.id,
    participant.location_lat,
    participant.location_lng,
    participant.location_name,
    participant.has_car,
    participant.seats,
  ]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        has_car: hasCar ? 1 : 0,
        seats: hasCar ? seats : 0,
      };
      if (location) {
        body.location_name = location.name;
        body.location_lat = location.lat;
        body.location_lng = location.lng;
      } else {
        body.location_name = null;
        body.location_lat = null;
        body.location_lng = null;
      }
      const res = await fetch(
        `/api/activities/${activityId}/participants/${participant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        setError("保存失败");
        return;
      }
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  function handleCarToggle(checked: boolean) {
    setHasCar(checked);
    if (!checked) {
      setSeats(0);
    } else if (seats < 1) {
      setSeats(4);
    }
  }

  function handleSeatsChange(newSeats: number) {
    if (newSeats < 1 || newSeats > 50) return;
    setSeats(newSeats);
  }

  const previewParticipant = useMemo((): Participant => {
    return {
      ...participant,
      location_lat: location?.lat ?? participant.location_lat,
      location_lng: location?.lng ?? participant.location_lng,
      location_name: location?.name ?? participant.location_name,
      has_car: hasCar ? 1 : 0,
      seats: hasCar ? seats : 0,
    };
  }, [participant, location, hasCar, seats]);

  const hasDeparture =
    previewParticipant.location_lat != null &&
    previewParticipant.location_lng != null;

  const markerTint: "green" | "red" =
    hasCar || !!participant.assigned_driver ? "green" : "red";

  const disbanded = activity.disbanded_at != null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="size-4" />
          我的信息
          <span className="text-sm font-normal text-muted-foreground">
            ({participant.nickname})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {disbanded && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            活动已解散，无法修改个人信息。
          </p>
        )}

        <div className="space-y-2">
          <Label>我的出发地</Label>
          <LocationPicker
            value={location}
            onChange={setLocation}
            placeholder="搜索你的出发地..."
            center={destCenter}
            personMarkerTint={markerTint}
            disabled={disbanded}
          />
        </div>

        {hasDeparture && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              路线预览
            </p>
            <RouteMap
              activity={activity}
              participants={participants}
              currentUserId={currentUserId}
              myParticipant={previewParticipant}
            />
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="size-4" />
            <Label htmlFor="car-toggle">我有车</Label>
          </div>
          <Switch
            id="car-toggle"
            checked={hasCar}
            disabled={disbanded}
            onCheckedChange={handleCarToggle}
          />
        </div>

        {hasCar && (
          <div className="flex items-center justify-between">
            <Label>可载人数（不含司机）</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleSeatsChange(seats - 1)}
                disabled={disbanded || seats <= 1}
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-8 text-center font-medium">{seats}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleSeatsChange(seats + 1)}
                disabled={disbanded || seats >= 50}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={disbanded || saving}
        >
          {saving ? "保存中…" : "保存"}
        </Button>

        {isCreator && !disbanded && (
          <>
            <Separator />
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              size="sm"
              disabled={disbanding}
              onClick={() => void disbandActivity()}
            >
              {disbanding ? "解散中…" : "解散活动"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
