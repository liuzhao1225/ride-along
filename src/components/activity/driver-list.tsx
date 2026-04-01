"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Car,
  Route,
  UserRound,
  LogIn,
  LogOut,
} from "lucide-react";
import { RouteMap } from "@/components/route-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Activity, Participant } from "@/lib/types";
import { getFetchJsonErrorMessage } from "@/features/trip/client/fetch-json";
import { tripClient } from "@/features/trip/client/trip-client";
import {
  getDriverPassengersMap,
  getMyDriverId,
  getUnassignedPassengers,
  sortDriversByMyGroup,
} from "@/features/trip/model";
import { AssignmentCard } from "./assignment-card";
import { AssignmentMemberRow } from "./assignment-member-row";

export function DriverList({
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
  /** 活动已解散等场景下禁止上下车操作 */
  interactionsDisabled?: boolean;
}) {
  const drivers = participants.filter((p) => p.has_car);
  const myDriverId = useMemo(
    () => getMyDriverId(currentUserId, participants),
    [participants, currentUserId]
  );
  const [expandedDriverIds, setExpandedDriverIds] = useState<string[]>([]);
  const [pendingPassengerId, setPendingPassengerId] = useState<string | null>(
    null
  );

  const passengersByDriver = useMemo(() => {
    return getDriverPassengersMap(drivers, participants);
  }, [drivers, participants]);

  const unassignedPassengers = useMemo(
    () => getUnassignedPassengers(participants),
    [participants]
  );
  const orderedDrivers = useMemo(() => {
    return sortDriversByMyGroup(drivers, currentUserId, participants);
  }, [drivers, currentUserId, participants]);

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
      await tripClient.updateAssignment(activityId, passengerId, {
        driver_member_id: driverMemberId,
      });
      toast.success("已更新编组");
      onUpdated();
    } catch (error) {
      toast.error(getFetchJsonErrorMessage(error, "更新编组失败"));
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
      {orderedDrivers.map((driver) => {
        const passengers = passengersByDriver.get(driver.id) ?? [];
        const availableSeats = Math.max(driver.seats - passengers.length, 0);
        const occupiedSeats = 1 + passengers.length;
        const totalSeats = 1 + driver.seats;
        const expanded = expandedDriverIds.includes(driver.id);
        const fullyBooked = availableSeats <= 0;
        const isMyGroup = myDriverId != null && driver.id === myDriverId;
        const eligibleUnassignedPassengers = unassignedPassengers.filter(
          (passenger) =>
            canManageAllAssignments || passenger.user_id === currentUserId
        );

        return (
          <AssignmentCard
            key={driver.id}
            title={driver.nickname}
            highlighted={isMyGroup}
            expanded={expanded}
            onToggle={() => toggleExpanded(driver.id)}
            summary={
              <Badge
                variant={availableSeats > 0 ? "outline" : "secondary"}
              >
                {occupiedSeats}/{totalSeats} 座
              </Badge>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Route className="size-4 text-primary" />
                  路线预览
                </div>
                <RouteMap
                  activity={activity}
                  participants={participants}
                  previewDriver={driver}
                  currentUserId={currentUserId}
                  heightClassName="h-48 sm:h-64"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="size-4 text-primary" />
                  车上人员
                </div>

                <AssignmentMemberRow
                  title={
                    <>
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
                    </>
                  }
                  subtitle={driver.location_name ?? "未设置出发地"}
                />

                {passengers.length > 0 ? (
                  <div className="space-y-2">
                    {passengers.map((passenger) => {
                      const pending = pendingPassengerId === passenger.id;
                      return (
                        <AssignmentMemberRow
                          key={passenger.id}
                          title={
                            <>
                              <UserRound className="size-3.5" />
                              <span className="truncate">{passenger.nickname}</span>
                              {passenger.pickup_order != null ? (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  第 {passenger.pickup_order} 站
                                </Badge>
                              ) : passenger.location_lat == null ? (
                                <Badge variant="secondary" className="text-[10px] px-1">
                                  待补位置
                                </Badge>
                              ) : null}
                              {passenger.user_id === currentUserId ? (
                                <Badge variant="secondary" className="text-[10px] px-1">
                                  我
                                </Badge>
                              ) : null}
                              {!passenger.is_free_agent ? (
                                <Badge variant="secondary" className="text-[10px] px-1">
                                  手动锁定
                                </Badge>
                              ) : null}
                            </>
                          }
                          subtitle={passenger.location_name ?? "未设置出发地"}
                          actions={
                            canManageAllAssignments ||
                            passenger.user_id === currentUserId ||
                            driver.user_id === currentUserId ? (
                              <Button
                                variant="ghost"
                                size="xs"
                                disabled={interactionsDisabled || pending}
                                onClick={() => void handleLeave(passenger.id)}
                              >
                                <LogOut className="size-3" />
                                {pending ? "处理中..." : "下车"}
                              </Button>
                            ) : null
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    这辆车现在还没人上车。
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">上下车编辑</div>
                  {fullyBooked ? (
                    <span className="text-xs text-muted-foreground">
                      已满座，需先让乘客下车
                    </span>
                  ) : null}
                </div>

                {eligibleUnassignedPassengers.length > 0 ? (
                  <div className="space-y-2">
                    {eligibleUnassignedPassengers.map((passenger) => {
                      const pending = pendingPassengerId === passenger.id;
                      return (
                        <AssignmentMemberRow
                          key={passenger.id}
                          dashed
                          title={
                            <>
                              <UserRound className="size-3.5" />
                              <span className="truncate">{passenger.nickname}</span>
                              {passenger.user_id === currentUserId ? (
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
                          subtitle={passenger.location_name ?? "未设置出发地"}
                          actions={
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={interactionsDisabled || fullyBooked || pending}
                              onClick={() => void handleBoard(passenger.id, driver.id)}
                            >
                              <LogIn className="size-3" />
                              {pending ? "处理中..." : "上车"}
                            </Button>
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    当前没有你可操作的待安排成员。
                  </p>
                )}
              </div>
            </div>
          </AssignmentCard>
        );
      })}
    </div>
  );
}
