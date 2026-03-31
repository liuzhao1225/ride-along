"use client";

import { useActivityData } from "@/contexts/activity-data-context";
import { DriverList } from "@/components/activity/driver-list";
import { UnassignedList } from "@/components/activity/unassigned-list";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

export default function ActivityRosterPage() {
  const {
    activity,
    activityId,
    participants,
    user,
    refresh,
  } = useActivityData();

  const disbanded = activity.disbanded_at != null;

  return (
    <div className="space-y-4">
      <DriverList
        participants={participants}
        currentUserId={user?.id}
        activityId={activityId}
        onUpdated={refresh}
        interactionsDisabled={disbanded}
      />

      <UnassignedList
        participants={participants}
        currentUserId={user?.id}
        activityId={activityId}
        onUpdated={refresh}
        interactionsDisabled={disbanded}
      />

      <Button
        className="w-full"
        disabled={disbanded}
        onClick={async () => {
          await fetch(`/api/activities/${activityId}/assign`, {
            method: "POST",
          });
          refresh();
        }}
      >
        <Shuffle className="size-4 mr-1" />
        自动分配乘客
      </Button>
    </div>
  );
}
