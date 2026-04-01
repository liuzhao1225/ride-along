"use client";

import { Car, Route } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TripMember } from "@/lib/types";

export function MyRideSection({
  myMember,
  myRide,
  description,
}: {
  myMember: TripMember | null | undefined;
  myRide: TripMember | null;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>我的乘车结果</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!myMember ? (
          <p className="text-muted-foreground">
            你还未加入这趟行程，请先通过邀请页确认加入。
          </p>
        ) : myMember.has_car === 1 ? (
          <div className="rounded-xl border bg-background px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Car className="size-4 text-emerald-600" />
              你是司机
            </div>
            <p className="mt-1 text-muted-foreground">
              当前设置可载 {myMember.seats} 人，请在“我的资料”里维护出发地和车辆信息。
            </p>
          </div>
        ) : myRide ? (
          <div className="rounded-xl border bg-background px-4 py-3">
            <div className="flex items-center gap-2 font-medium">
              <Route className="size-4 text-emerald-600" />
              你当前乘坐 {myRide.nickname} 的车
            </div>
            <p className="mt-1 text-muted-foreground">
              {myRide.location_name
                ? `司机出发地：${myRide.location_name}`
                : "司机尚未填写出发地。"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-background px-4 py-3">
            <div className="font-medium">你暂时还未分配车辆</div>
            <p className="mt-1 text-muted-foreground">
              {myMember.is_free_agent
                ? "先把自己的出发地和是否开车填写完整，系统会自动重新编组。"
                : "你当前处于手动下车状态，点击自动编组后会重新作为自由人参与编排。"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
