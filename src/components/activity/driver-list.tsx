"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Car, MapPin, UserRound, LogOut } from "lucide-react";
import type { Participant } from "@/lib/types";

export function DriverList({
  participants,
  currentUserId,
  activityId,
  onUpdated,
  canManageAssignments = false,
  interactionsDisabled = false,
}: {
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
  canManageAssignments?: boolean;
  /** 活动已解散等场景下禁止上下车操作 */
  interactionsDisabled?: boolean;
}) {
  const drivers = participants.filter((p) => p.has_car);

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

  async function handleLeave(passengerId: string) {
    await fetch(`/api/trips/${activityId}/assignments/${passengerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driver_member_id: null }),
    });
    onUpdated();
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Car className="size-4" />
        车辆编组
      </h3>
      {drivers.map((driver) => {
        const passengers = participants.filter(
          (p) => p.assigned_driver === driver.id
        );
        const availableSeats = driver.seats - passengers.length;
        return (
          <Card key={driver.id}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-primary" />
                  <span className="font-medium">{driver.nickname}</span>
                  {driver.user_id === currentUserId && (
                    <Badge variant="secondary" className="text-xs">
                      我
                    </Badge>
                  )}
                </div>
                <Badge
                  variant={availableSeats > 0 ? "outline" : "secondary"}
                >
                  {passengers.length}/{driver.seats} 座
                </Badge>
              </div>
              {driver.location_name && (
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="size-3" />
                  出发: {driver.location_name}
                </p>
              )}
              {passengers.length > 0 && (
                <div className="space-y-1 ml-6">
                  {passengers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-1">
                        <UserRound className="size-3" />
                        {p.nickname}
                        {p.user_id === currentUserId && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1"
                          >
                            我
                          </Badge>
                        )}
                      </span>
                      {canManageAssignments && (
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={interactionsDisabled}
                          onClick={() => handleLeave(p.id)}
                        >
                          <LogOut className="size-3" />
                          下车
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
