"use client";

import { useState } from "react";
import { Calendar, Car, MapPin, PencilLine, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatActivityDateDisplay } from "@/lib/activity-date";
import type { TripDashboardData, TripStatus } from "../types";
import { TripSettingsPanel } from "./trip-settings-panel";

const statusLabel: Record<TripStatus, string> = {
  collecting: "收集中",
  assigned: "已编组",
  closed: "已关闭",
};

export function TripSummaryCard({
  data,
  compact = false,
  editable = false,
  onUpdated,
}: {
  data: TripDashboardData;
  compact?: boolean;
  editable?: boolean;
  onUpdated?: (data?: TripDashboardData) => void;
}) {
  const { trip, stats, status } = data;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className={compact ? "pb-3" : undefined}>
          <CardTitle className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate">{trip.name}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{trip.dest_name}</span>
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={status === "closed" ? "secondary" : "outline"}>
                {statusLabel[status]}
              </Badge>
              {editable && onUpdated ? (
                <Button
                  type="button"
                  variant="outline"
                  size={compact ? "xs" : "sm"}
                  onClick={() => setEditOpen(true)}
                >
                  <PencilLine className="size-3.5" />
                  编辑
                </Button>
              ) : null}
            </div>
          </CardTitle>
          {!compact ? (
            <CardDescription>一趟面向熟人局的临时拼车编组</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              日期
            </div>
            <div className="mt-1 font-medium">
              {formatActivityDateDisplay(trip.event_at) ?? "未设置"}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              已加入
            </div>
            <div className="mt-1 font-medium">{stats.totalMembers} 人</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              已填位置
            </div>
            <div className="mt-1 font-medium">{stats.completedProfiles} 人</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Car className="size-3" />
              可用座位
            </div>
            <div className="mt-1 font-medium">{stats.availableSeats} 座</div>
          </div>
        </CardContent>
      </Card>

      {editable && onUpdated ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl p-0 sm:max-w-2xl">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>编辑行程信息</DialogTitle>
              <DialogDescription>
                可修改行程名称、日期和目的地，保存后会同步到当前行程。
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6">
              <TripSettingsPanel
                trip={trip}
                onUpdated={onUpdated}
                onSaved={() => setEditOpen(false)}
                embedded
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
