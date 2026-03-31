"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shuffle,
  LogOut,
  Copy,
  Check,
  Car,
  Route,
} from "lucide-react";
import { AMapProvider } from "@/components/amap-loader";
import { DriverList } from "@/components/activity/driver-list";
import { MyInfoPanel } from "@/components/activity/my-info-panel";
import { UnassignedList } from "@/components/activity/unassigned-list";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TripDashboardData } from "../types";
import { getMyRide } from "../model";
import { TripSummaryCard } from "./trip-summary-card";

function DashboardInner({ tripId }: { tripId: string }) {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const [data, setData] = useState<TripDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAssign, setPendingAssign] = useState(false);
  const [pendingLeave, setPendingLeave] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "加载失败");
        return;
      }
      setData(json);
      setError(null);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuth(true);
    }
  }, [authLoading, user]);

  const myMember = useMemo(
    () => data?.members.find((member) => member.user_id === user?.id),
    [data, user]
  );

  const myRide = useMemo(
    () => getMyRide(myMember, data?.members ?? []),
    [myMember, data]
  );

  const isOrganizer = user?.id != null && data?.trip.created_by === user.id;
  const isClosed = data?.status === "closed";

  async function handleAutoAssign() {
    if (!data) return;
    setPendingAssign(true);
    try {
      await fetch(`/api/trips/${data.trip.id}/auto-assign`, { method: "POST" });
      await refresh();
    } finally {
      setPendingAssign(false);
    }
  }

  async function handleLeave() {
    if (!data || !window.confirm("确定退出这趟行程？")) return;
    setPendingLeave(true);
    try {
      const res = await fetch(`/api/trips/${data.trip.id}/me`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      }
    } finally {
      setPendingLeave(false);
    }
  }

  async function handleCloseTrip() {
    if (!data || !window.confirm("确定关闭这趟行程？关闭后成员将只能查看。")) {
      return;
    }
    setPendingClose(true);
    try {
      await fetch(`/api/trips/${data.trip.id}/close`, { method: "POST" });
      await refresh();
    } finally {
      setPendingClose(false);
    }
  }

  async function handleCopyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/t/${tripId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{error ?? "行程不存在"}</p>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline">
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="ghost"
              size="icon-sm"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <div className="truncate font-semibold">{data.trip.name}</div>
              <div className="text-xs text-muted-foreground">
                单页控制台：概览、编组、我的资料都在这里
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyInvite}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "已复制" : "复制邀请"}
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                <LogOut className="size-4" />
                退出
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <TripSummaryCard data={data} />

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>编组结果</CardTitle>
                  <CardDescription>
                    由发起人统一执行自动编组并做微调。
                  </CardDescription>
                </div>
                {isOrganizer ? (
                  <Button
                    onClick={() => void handleAutoAssign()}
                    disabled={pendingAssign || isClosed}
                    className="shrink-0"
                  >
                    <Shuffle className="size-4" />
                    {pendingAssign ? "编组中..." : "自动编组"}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-5">
                <DriverList
                  participants={data.members}
                  currentUserId={user?.id}
                  activityId={data.trip.id}
                  onUpdated={refresh}
                  canManageAssignments={Boolean(isOrganizer)}
                  interactionsDisabled={isClosed}
                />
                <UnassignedList
                  participants={data.members}
                  currentUserId={user?.id}
                  activityId={data.trip.id}
                  onUpdated={refresh}
                  canManageAssignments={Boolean(isOrganizer)}
                  interactionsDisabled={isClosed}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>我的乘车结果</CardTitle>
                <CardDescription>
                  个人只需要知道自己开车、坐谁的车，或者目前还未分配。
                </CardDescription>
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
                      当前设置可载 {myMember.seats} 人，请在下方维护你的出发地和车辆信息。
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
                      先把自己的出发地和是否开车填写完整，发起人再统一编组。
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {myMember ? (
              <MyInfoPanel
                participant={myMember}
                activityId={data.trip.id}
                onUpdated={refresh}
                destCenter={[data.trip.dest_lng, data.trip.dest_lat]}
                activity={data.trip}
                participants={data.members}
                isOrganizer={Boolean(isOrganizer)}
                disbanding={pendingClose}
                onCloseTrip={handleCloseTrip}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>我的资料</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    nativeButton={false}
                    render={<Link href={`/t/${data.trip.id}`} />}
                    className="w-full"
                  >
                    去邀请页加入并填写资料
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isOrganizer && myMember ? (
              <Card>
                <CardHeader>
                  <CardTitle>退出行程</CardTitle>
                  <CardDescription>
                    普通成员可以退出；发起人只能关闭整趟行程。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={pendingLeave || isClosed}
                    onClick={() => void handleLeave()}
                  >
                    {pendingLeave ? "退出中..." : "退出这趟行程"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      </main>

      <PasswordAuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        supabase={supabase}
      />
    </div>
  );
}

export function TripDashboardClient({ tripId }: { tripId: string }) {
  return (
    <AMapProvider>
      <DashboardInner tripId={tripId} />
    </AMapProvider>
  );
}
