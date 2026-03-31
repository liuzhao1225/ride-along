"use client";

import { RouteMap } from "@/components/route-map";
import { useActivityData } from "@/contexts/activity-data-context";
import { canShowActivityRouteMap } from "@/lib/activity-map-policy";

export default function ActivityMapPage() {
  const { activity, participants, user, myParticipant } = useActivityData();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        登录后可查看路线地图。
      </p>
    );
  }

  if (!myParticipant) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        加入活动后即可查看路线地图。
      </p>
    );
  }

  if (!canShowActivityRouteMap(user.id, myParticipant)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        当前无法显示路线预览。
      </p>
    );
  }

  return (
    <RouteMap
      activity={activity}
      participants={participants}
      currentUserId={user.id}
      myParticipant={myParticipant}
    />
  );
}
