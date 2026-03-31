"use client";

import { MyInfoPanel } from "@/components/activity/my-info-panel";
import { useActivityData } from "@/contexts/activity-data-context";

export default function ActivityMePage() {
  const {
    activity,
    activityId,
    participants,
    user,
    myParticipant,
    refresh,
  } = useActivityData();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        请先登录以编辑本活动中的信息。
      </p>
    );
  }

  if (!myParticipant) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        正在加入活动…
      </p>
    );
  }

  return (
    <MyInfoPanel
      participant={myParticipant}
      activityId={activityId}
      onUpdated={refresh}
      destCenter={[activity.dest_lng, activity.dest_lat]}
      activity={activity}
      participants={participants}
      currentUserId={user.id}
    />
  );
}
