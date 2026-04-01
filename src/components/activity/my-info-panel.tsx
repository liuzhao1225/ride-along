"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
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
import { Car, UserRound, Minus, Plus } from "lucide-react";
import type { Activity, Participant } from "@/lib/types";
import { getFetchJsonErrorMessage } from "@/features/trip/client/fetch-json";
import { tripClient } from "@/features/trip/client/trip-client";

export function MyInfoPanel({
  participant,
  activityId,
  onUpdated,
  destCenter,
  activity,
  participants,
  isOrganizer = false,
  destructivePending = false,
  onDestructiveAction,
}: {
  participant: Participant;
  activityId: string;
  onUpdated: () => void;
  destCenter: [number, number];
  activity: Activity;
  participants: Participant[];
  isOrganizer?: boolean;
  destructivePending?: boolean;
  onDestructiveAction?: (() => Promise<void> | void);
}) {
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
  const [seats, setSeats] = useState(
    participant.has_car ? (participant.seats ?? 3) : 0
  );
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
    setSeats(participant.has_car ? (participant.seats ?? 3) : 0);
  }, [
    participant.id,
    participant.location_lat,
    participant.location_lng,
    participant.location_name,
    participant.has_car,
    participant.seats,
  ]);

  async function handleSave() {
    if (!location) {
      setError("请先填写出发地");
      return;
    }
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

      await tripClient.saveMyProfileAndRefreshAssignments(
        activityId,
        body,
        false
      );
      toast.success("资料已保存");
      toast.success("自动编组已刷新");
      onUpdated();
    } catch (nextError) {
      setError(getFetchJsonErrorMessage(nextError, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  function handleCarToggle(checked: boolean) {
    setHasCar(checked);
    if (!checked) {
      setSeats(0);
    } else if (seats < 0) {
      setSeats(0);
    }
  }

  function handleSeatsChange(newSeats: number) {
    if (newSeats < 0 || newSeats > 50) return;
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
          我的资料
          <span className="text-sm font-normal text-muted-foreground">
            ({participant.nickname})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {disbanded && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            行程已关闭，无法修改个人资料。
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
              myParticipant={previewParticipant}
              currentUserId={participant.user_id}
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
                disabled={disbanded || seats <= 0}
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
          disabled={disbanded || saving || !location}
        >
          {saving ? "保存中…" : "保存"}
        </Button>
        {!location && !disbanded ? (
          <p className="text-xs text-muted-foreground">
            必须先填写出发地，才能保存资料。
          </p>
        ) : null}

        {!disbanded && onDestructiveAction && (
          <>
            <Separator />
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              size="sm"
              disabled={destructivePending}
              onClick={() => void onDestructiveAction()}
            >
              {destructivePending
                ? isOrganizer
                  ? "关闭中…"
                  : "退出中…"
                : isOrganizer
                  ? "关闭行程"
                  : "退出行程"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
