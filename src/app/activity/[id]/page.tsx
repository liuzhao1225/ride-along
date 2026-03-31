"use client";

import { useActivityData } from "@/contexts/activity-data-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, UserRound, Calendar } from "lucide-react";
import { formatActivityDateDisplay } from "@/lib/activity-date";

export default function ActivityOverviewPage() {
  const { activity, participants, user, myParticipant } = useActivityData();
  const eventLabel = formatActivityDateDisplay(activity.event_at);
  const creatorLabel =
    activity.creator_display_name?.trim() || "（未知）";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">活动摘要</CardTitle>
          <CardDescription>
            {participants.length} 人已加入
            {user && myParticipant ? " · 你已在活动中" : ""}
            {activity.disbanded_at != null ? " · 已解散" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <UserRound className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-muted-foreground text-xs">创建人</div>
              <div>{creatorLabel}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-muted-foreground text-xs">目的地</div>
              <div>{activity.dest_name}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-muted-foreground text-xs">活动日期</div>
              <div>{eventLabel ?? "未设置"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
