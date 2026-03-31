"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserRound, LogIn } from "lucide-react";
import type { Participant } from "@/lib/types";

export function UnassignedList({
  participants,
  currentUserId,
  activityId,
  onUpdated,
  interactionsDisabled = false,
}: {
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
  interactionsDisabled?: boolean;
}) {
  const unassigned = participants.filter(
    (p) => !p.has_car && !p.assigned_driver
  );
  const drivers = participants.filter((p) => p.has_car);

  async function handleBoard(passengerId: string, driverId: string) {
    await fetch(`/api/activities/${activityId}/ride`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passenger_id: passengerId, driver_id: driverId }),
    });
    onUpdated();
  }

  if (unassigned.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Users className="size-4" />
        未分配乘客 ({unassigned.length})
      </h3>
      <Card>
        <CardContent className="py-3 space-y-2">
          {unassigned.map((p) => {
            const isMe = p.user_id === currentUserId;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1 text-sm">
                  <UserRound className="size-3" />
                  {p.nickname}
                  {isMe && (
                    <Badge variant="secondary" className="text-[10px] px-1">
                      我
                    </Badge>
                  )}
                  {!p.location_lat && (
                    <span className="text-xs text-muted-foreground">
                      (未设置位置)
                    </span>
                  )}
                </span>
                {drivers.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {drivers.map((d) => {
                      const pCount = participants.filter(
                        (pp) => pp.assigned_driver === d.id
                      ).length;
                      const full = pCount >= d.seats;
                      return (
                        <Button
                          key={d.id}
                          variant="outline"
                          size="xs"
                          disabled={full || interactionsDisabled}
                          onClick={() => handleBoard(p.id, d.id)}
                          title={`上 ${d.nickname} 的车`}
                        >
                          <LogIn className="size-3" />
                          {d.nickname}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
