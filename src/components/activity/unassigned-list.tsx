"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserRound,
  LogIn,
} from "lucide-react";
import { RouteMap } from "@/components/route-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity, Participant } from "@/lib/types";
import { getFetchJsonErrorMessage } from "@/features/trip/client/fetch-json";
import { tripClient } from "@/features/trip/client/trip-client";
import {
  countAssignedPassengers,
  getUnassignedReason,
} from "@/features/trip/model";
import { AssignmentCard } from "./assignment-card";
import { AssignmentMemberRow } from "./assignment-member-row";

export function UnassignedList({
  activity,
  participants,
  currentUserId,
  highlighted = false,
  activityId,
  onUpdated,
  canManageAllAssignments = false,
  interactionsDisabled = false,
}: {
  activity: Activity;
  participants: Participant[];
  currentUserId?: string;
  highlighted?: boolean;
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

  async function handleBoard(passengerId: string, driverId: string) {
    setPendingPassengerId(passengerId);
    try {
      await tripClient.updateAssignment(activityId, passengerId, {
        driver_member_id: driverId,
      });
      toast.success("已更新编组");
      onUpdated();
    } catch (error) {
      toast.error(getFetchJsonErrorMessage(error, "更新编组失败"));
    } finally {
      setPendingPassengerId(null);
    }
  }

  return (
    <div className="space-y-3">
      <AssignmentCard
        title="未分组人员"
        expanded={expanded}
        highlighted={highlighted}
        onToggle={() => setExpanded((value) => !value)}
        summary={
          <Badge variant={unassigned.length > 0 ? "outline" : "secondary"}>
            {unassigned.length} 人未分组
          </Badge>
        }
      >
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
              currentUserId={currentUserId}
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
                const reason = getUnassignedReason(passenger, drivers, participants);

                return (
                  <div
                    key={passenger.id}
                    className="space-y-3 rounded-xl border bg-background px-3 py-3"
                  >
                    <AssignmentMemberRow
                      title={
                        <>
                          <UserRound className="size-3.5" />
                          <span className="truncate">{passenger.nickname}</span>
                          {isMe ? (
                            <Badge variant="secondary" className="text-[10px] px-1">
                              我
                            </Badge>
                          ) : null}
                          {!passenger.is_free_agent ? (
                            <Badge variant="secondary" className="text-[10px] px-1">
                              手动下车
                            </Badge>
                          ) : null}
                        </>
                      }
                      subtitle={`${passenger.location_name ?? "未设置出发地"} · ${reason}`}
                    />

                    {drivers.length > 0 && canBoardThisPassenger ? (
                      <div className="flex flex-wrap gap-2">
                        {drivers.map((driver) => {
                          const passengerCount = countAssignedPassengers(
                            driver.id,
                            participants
                          );
                          const full = passengerCount >= driver.seats;

                          return (
                            <Button
                              key={driver.id}
                              variant="outline"
                              size="xs"
                              disabled={full || interactionsDisabled || pending}
                              onClick={() => void handleBoard(passenger.id, driver.id)}
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
      </AssignmentCard>
    </div>
  );
}
