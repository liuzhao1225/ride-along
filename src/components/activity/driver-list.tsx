"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Car,
  Route,
  UserRound,
  LogIn,
  LogOut,
} from "lucide-react";
import { RouteMap } from "@/components/route-map";
import type { Activity, Participant } from "@/lib/types";

export function DriverList({
  activity,
  participants,
  currentUserId,
  activityId,
  onUpdated,
  canManageAssignments = false,
  interactionsDisabled = false,
}: {
  activity: Activity;
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
  canManageAssignments?: boolean;
  /** 活动已解散等场景下禁止上下车操作 */
  interactionsDisabled?: boolean;
}) {
  const drivers = participants.filter((p) => p.has_car);
  const [expandedDriverIds, setExpandedDriverIds] = useState<string[]>([]);
  const [pendingPassengerId, setPendingPassengerId] = useState<string | null>(
    null
  );

  const passengersByDriver = useMemo(() => {
    const grouped = new Map<string, Participant[]>();
    for (const driver of drivers) {
      grouped.set(driver.id, []);
    }
    for (const participant of participants) {
      if (participant.assigned_driver && grouped.has(participant.assigned_driver)) {
        grouped.get(participant.assigned_driver)?.push(participant);
      }
    }
    for (const [driverId, groupedPassengers] of grouped.entries()) {
      grouped.set(
        driverId,
        groupedPassengers.sort((left, right) => {
          const leftOrder = left.pickup_order ?? Number.MAX_SAFE_INTEGER;
          const rightOrder = right.pickup_order ?? Number.MAX_SAFE_INTEGER;
          if (leftOrder !== rightOrder) return leftOrder - rightOrder;
          return left.created_at - right.created_at;
        })
      );
    }
    return grouped;
  }, [drivers, participants]);

  const unassignedPassengers = useMemo(
    () => participants.filter((p) => !p.has_car && !p.assigned_driver),
    [participants]
  );

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          <Car className="size-8 mx-auto mb-2 opacity-40" />
          暂无司机
        </CardContent>
      </Card>
    );
  }

  function toggleExpanded(driverId: string) {
    setExpandedDriverIds((current) =>
      current.includes(driverId)
        ? current.filter((id) => id !== driverId)
        : [...current, driverId]
    );
  }

  async function updateAssignment(
    passengerId: string,
    driverMemberId: string | null
  ) {
    setPendingPassengerId(passengerId);
    try {
      const res = await fetch(`/api/trips/${activityId}/assignments/${passengerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_member_id: driverMemberId }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(json.error ?? "更新编组失败");
        return;
      }

      toast.success("已更新编组");
      onUpdated();
    } finally {
      setPendingPassengerId(null);
    }
  }

  async function handleLeave(passengerId: string) {
    await updateAssignment(passengerId, null);
  }

  async function handleBoard(passengerId: string, driverId: string) {
    await updateAssignment(passengerId, driverId);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Car className="size-4" />
        车辆编组
      </h3>
      {drivers.map((driver) => {
        const passengers = passengersByDriver.get(driver.id) ?? [];
        const availableSeats = Math.max(driver.seats - passengers.length, 0);
        const expanded = expandedDriverIds.includes(driver.id);
        const fullyBooked = availableSeats <= 0;

        return (
          <Card key={driver.id}>
            <CardContent className="py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => toggleExpanded(driver.id)}
                aria-expanded={expanded}
              >
                <span className="min-w-0 truncate font-medium">
                  {driver.nickname}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant={availableSeats > 0 ? "outline" : "secondary"}
                  >
                    {passengers.length}/{driver.seats} 座
                  </Badge>
                  {expanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </span>
              </button>

              {expanded ? (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Route className="size-4 text-primary" />
                      路线预览
                    </div>
                    <RouteMap
                      activity={activity}
                      participants={participants}
                      previewDriver={driver}
                      heightClassName="h-48 sm:h-64"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserRound className="size-4 text-primary" />
                      车上人员
                    </div>

                    <div className="rounded-xl border bg-background px-3 py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Car className="size-4 text-primary" />
                        <span className="truncate">{driver.nickname}</span>
                        <Badge variant="secondary" className="text-[10px] px-1">
                          车主
                        </Badge>
                        {driver.user_id === currentUserId ? (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            我
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {driver.location_name ?? "未设置出发地"}
                      </p>
                    </div>

                    {passengers.length > 0 ? (
                      <div className="space-y-2">
                        {passengers.map((passenger) => {
                          const pending = pendingPassengerId === passenger.id;
                          return (
                            <div
                              key={passenger.id}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <UserRound className="size-3.5" />
                                  <span className="truncate">
                                    {passenger.nickname}
                                  </span>
                                  {passenger.pickup_order != null ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1"
                                    >
                                      第 {passenger.pickup_order} 站
                                    </Badge>
                                  ) : passenger.location_lat == null ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1"
                                    >
                                      待补位置
                                    </Badge>
                                  ) : null}
                                  {passenger.user_id === currentUserId ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1"
                                    >
                                      我
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {passenger.location_name ?? "未设置出发地"}
                                </p>
                              </div>

                              {canManageAssignments ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  disabled={interactionsDisabled || pending}
                                  onClick={() => void handleLeave(passenger.id)}
                                >
                                  <LogOut className="size-3" />
                                  {pending ? "处理中..." : "下车"}
                                </Button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        这辆车现在还没人上车。
                      </p>
                    )}
                  </div>

                  {canManageAssignments ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">上下车编辑</div>
                        {fullyBooked ? (
                          <span className="text-xs text-muted-foreground">
                            已满座，需先让乘客下车
                          </span>
                        ) : null}
                      </div>

                      {unassignedPassengers.length > 0 ? (
                        <div className="space-y-2">
                          {unassignedPassengers.map((passenger) => {
                            const pending = pendingPassengerId === passenger.id;
                            return (
                              <div
                                key={passenger.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-background px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <UserRound className="size-3.5" />
                                    <span className="truncate">
                                      {passenger.nickname}
                                    </span>
                                    {passenger.user_id === currentUserId ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1"
                                      >
                                        我
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {passenger.location_name ?? "未设置出发地"}
                                  </p>
                                </div>

                                <Button
                                  variant="outline"
                                  size="xs"
                                  disabled={
                                    interactionsDisabled || fullyBooked || pending
                                  }
                                  onClick={() =>
                                    void handleBoard(passenger.id, driver.id)
                                  }
                                >
                                  <LogIn className="size-3" />
                                  {pending ? "处理中..." : "上车"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          当前没有待安排成员。
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
