"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserRound,
  LogIn,
} from "lucide-react";
import { RouteMap } from "@/components/route-map";
import type { Activity, Participant } from "@/lib/types";

export function UnassignedList({
  activity,
  participants,
  currentUserId,
  activityId,
  onUpdated,
  canManageAllAssignments = false,
  interactionsDisabled = false,
}: {
  activity: Activity;
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
  canManageAllAssignments?: boolean;
  interactionsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pendingPassengerId, setPendingPassengerId] = useState<string | null>(
    null
  );
  const unassigned = participants.filter(
    (p) => !p.has_car && !p.assigned_driver
  );
  const drivers = participants.filter((p) => p.has_car);
  const totalAvailableSeats = drivers.reduce((sum, driver) => {
    const assignedCount = participants.filter(
      (participant) => participant.assigned_driver === driver.id
    ).length;
    return sum + Math.max(driver.seats - assignedCount, 0);
  }, 0);

  async function handleBoard(passengerId: string, driverId: string) {
    setPendingPassengerId(passengerId);
    try {
      const res = await fetch(`/api/trips/${activityId}/assignments/${passengerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_member_id: driverId }),
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

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="py-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <span className="font-medium">未分组人员</span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant={unassigned.length > 0 ? "outline" : "secondary"}>
                {unassigned.length} 人未分组
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
              {unassigned.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4 text-primary" />
                    未分组点位
                  </div>
                  <RouteMap
                    activity={activity}
                    participants={participants}
                    previewParticipants={unassigned}
                    heightClassName="h-48 sm:h-64"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="size-4 text-primary" />
                  详细列表
                </div>

                {unassigned.length > 0 ? (
                  <div className="space-y-2">
                    {unassigned.map((passenger) => {
                      const isMe = passenger.user_id === currentUserId;
                      const canBoardThisPassenger =
                        canManageAllAssignments || isMe;
                      const pending = pendingPassengerId === passenger.id;
                      const reason =
                        !passenger.is_free_agent
                          ? "已手动下车，自动编组会跳过"
                          : passenger.location_lat == null
                          ? "未设置位置"
                          : drivers.length === 0
                            ? "暂无司机"
                            : totalAvailableSeats <= 0
                              ? "座位不足"
                              : "等待编组";

                      return (
                        <div
                          key={passenger.id}
                          className="space-y-3 rounded-xl border bg-background px-3 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <UserRound className="size-3.5" />
                              <span className="truncate">{passenger.nickname}</span>
                              {isMe ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1"
                                >
                                  我
                                </Badge>
                              ) : null}
                              {!passenger.is_free_agent ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1"
                                >
                                  手动下车
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {(passenger.location_name ?? "未设置出发地") +
                                ` · ${reason}`}
                            </p>
                          </div>

                          {drivers.length > 0 && canBoardThisPassenger ? (
                            <div className="flex flex-wrap gap-2">
                              {drivers.map((driver) => {
                                const passengerCount = participants.filter(
                                  (member) => member.assigned_driver === driver.id
                                ).length;
                                const full = passengerCount >= driver.seats;

                                return (
                                  <Button
                                    key={driver.id}
                                    variant="outline"
                                    size="xs"
                                    disabled={full || interactionsDisabled || pending}
                                    onClick={() =>
                                      void handleBoard(passenger.id, driver.id)
                                    }
                                    title={`上 ${driver.nickname} 的车`}
                                  >
                                    <LogIn className="size-3" />
                                    {pending ? "处理中..." : `上 ${driver.nickname} 的车`}
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {drivers.length === 0
                                ? "当前还没有可分配的车辆。"
                                : canManageAllAssignments
                                  ? "当前没有可用座位。"
                                  : isMe
                                    ? "你可以给自己选择车辆。"
                                    : "该成员需要自己选择车辆。"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    当前所有成员都已分组。
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
