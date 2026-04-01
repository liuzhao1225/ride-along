"use client";

import { Shuffle } from "lucide-react";
import { DriverList } from "@/components/activity/driver-list";
import { UnassignedList } from "@/components/activity/unassigned-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Trip, TripMember } from "@/lib/types";

export function AssignmentSection({
  trip,
  members,
  currentUserId,
  canManageAllAssignments,
  interactionsDisabled,
  autoAssignPending,
  showAutoAssign,
  autoAssignPlacement = "header",
  highlightUnassigned,
  onAutoAssign,
  onUpdated,
}: {
  trip: Trip;
  members: TripMember[];
  currentUserId?: string;
  canManageAllAssignments: boolean;
  interactionsDisabled: boolean;
  autoAssignPending: boolean;
  showAutoAssign: boolean;
  autoAssignPlacement?: "header" | "footer";
  highlightUnassigned: boolean;
  onAutoAssign: () => void;
  onUpdated: () => void;
}) {
  const driverList = (
    <DriverList
      activity={trip}
      participants={members}
      currentUserId={currentUserId}
      activityId={trip.id}
      onUpdated={onUpdated}
      canManageAllAssignments={canManageAllAssignments}
      interactionsDisabled={interactionsDisabled}
    />
  );

  const unassignedList = (
    <UnassignedList
      activity={trip}
      participants={members}
      currentUserId={currentUserId}
      highlighted={highlightUnassigned}
      activityId={trip.id}
      onUpdated={onUpdated}
      canManageAllAssignments={canManageAllAssignments}
      interactionsDisabled={interactionsDisabled}
    />
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>编组结果</CardTitle>
          <CardDescription>
            保存资料会触发自动编组；你也可以随时重新编排。
          </CardDescription>
        </div>
        {showAutoAssign && autoAssignPlacement === "header" ? (
          <Button
            onClick={onAutoAssign}
            disabled={autoAssignPending || interactionsDisabled}
            className="w-full shrink-0 sm:w-auto"
          >
            <Shuffle className="size-4" />
            {autoAssignPending ? "编组中..." : "自动编组"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {highlightUnassigned ? (
          <>
            {unassignedList}
            {driverList}
          </>
        ) : (
          <>
            {driverList}
            {unassignedList}
          </>
        )}
        {showAutoAssign && autoAssignPlacement === "footer" ? (
          <Button
            onClick={onAutoAssign}
            disabled={autoAssignPending || interactionsDisabled}
            className="w-full"
          >
            <Shuffle className="size-4" />
            {autoAssignPending ? "编组中..." : "自动编组"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
