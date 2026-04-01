"use client";

import { MyInfoPanel } from "@/components/activity/my-info-panel";
import type { Trip, TripMember } from "@/lib/types";
import { JoinTripPrompt } from "./join-trip-prompt";

export function MyProfileSection({
  trip,
  members,
  myMember,
  isOrganizer,
  pendingDestructiveAction,
  onDestructiveAction,
  onUpdated,
}: {
  trip: Trip;
  members: TripMember[];
  myMember: TripMember | null | undefined;
  isOrganizer: boolean;
  pendingDestructiveAction: boolean;
  onDestructiveAction: () => Promise<void> | void;
  onUpdated: () => void;
}) {
  if (!myMember) {
    return <JoinTripPrompt tripId={trip.id} />;
  }

  return (
    <MyInfoPanel
      participant={myMember}
      activityId={trip.id}
      onUpdated={onUpdated}
      destCenter={[trip.dest_lng, trip.dest_lat]}
      activity={trip}
      participants={members}
      isOrganizer={isOrganizer}
      destructivePending={pendingDestructiveAction}
      onDestructiveAction={onDestructiveAction}
    />
  );
}
