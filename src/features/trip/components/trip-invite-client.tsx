"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Car, LogIn, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AMapProvider } from "@/components/amap-loader";
import { LocationPicker, type Location } from "@/components/location-picker";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TripDashboardData } from "../types";
import { TripSummaryCard } from "./trip-summary-card";

function InviteInner({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [pending, setPending] = useState(false);
  const [data, setData] = useState<TripDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [departure, setDeparture] = useState<Location | null>(null);
  const [canDrive, setCanDrive] = useState(false);
  const [seats, setSeats] = useState(3);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/trips/${inviteCode}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) {
          setError((json as { error?: string }).error ?? "行程不存在");
        }
        return;
      }
      if (!cancelled) {
        setData(json);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  useEffect(() => {
    if (user && !nickname.trim()) {
      setNickname(
        ((user.user_metadata?.display_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "成员") as string
      );
    }
  }, [user, nickname]);

  const myMember = useMemo(
    () => data?.members.find((member) => member.user_id === user?.id),
    [data, user]
  );
  const profileComplete = departure != null;

  useEffect(() => {
    if (!myMember) return;

    setNickname(myMember.nickname || "");
    setDeparture(
      myMember.location_lat != null && myMember.location_lng != null
        ? {
            name: myMember.location_name || "已选择",
            lat: myMember.location_lat,
            lng: myMember.location_lng,
          }
        : null
    );
    setCanDrive(myMember.has_car === 1);
    setSeats(myMember.has_car === 1 ? Math.max(myMember.seats || 1, 1) : 3);
  }, [myMember]);

  async function submit() {
    if (!user || !data) return;
    if (!departure) {
      setError("请先填写出发地");
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (!myMember) {
        const joinRes = await fetch(`/api/trips/${data.trip.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: nickname.trim() || "成员" }),
        });
        const joinJson = await joinRes.json().catch(() => ({}));
        if (!joinRes.ok) {
          setError((joinJson as { error?: string }).error ?? "加入失败");
          return;
        }
      }

      const profileRes = await fetch(`/api/trips/${data.trip.id}/my-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim() || "成员",
          location_name: departure?.name ?? null,
          location_lat: departure?.lat ?? null,
          location_lng: departure?.lng ?? null,
          has_car: canDrive ? 1 : 0,
          seats: canDrive ? seats : 0,
        }),
      });
      const profileJson = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) {
        setError((profileJson as { error?: string }).error ?? "保存失败");
        return;
      }

      toast.success("资料已保存");

      const autoAssignRes = await fetch(`/api/trips/${data.trip.id}/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock_self: false }),
      });
      const autoAssignJson = await autoAssignRes.json().catch(() => ({}));
      if (!autoAssignRes.ok) {
        setError(
          (autoAssignJson as { error?: string }).error ?? "自动编组失败"
        );
        return;
      }

      router.push(`/trips/${data.trip.id}`);
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Car className="size-5" />
            </div>
            <div>
              <div className="font-semibold">加入拼车行程</div>
              <div className="text-xs text-muted-foreground">
                先确认参与，再补全你的拼车资料
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-4 sm:gap-6 sm:py-8 lg:grid-cols-[1fr_1fr]">
        <TripSummaryCard data={data} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="size-4" />
              {myMember ? "补全资料后进入行程" : "确认加入"}
            </CardTitle>
            <CardDescription>
              必须先填写出发地，才能进入行程控制台。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-name">显示名称</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="join-name"
                  className="pl-9"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="群里大家怎么称呼你"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>出发地</Label>
              <LocationPicker
                value={departure}
                onChange={setDeparture}
                placeholder="搜索你的出发地..."
                center={[data.trip.dest_lng, data.trip.dest_lat]}
                personMarkerTint={canDrive ? "green" : "red"}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm">
              <Label htmlFor="join-can-drive" className="cursor-pointer">
                我可以开车
              </Label>
              <Switch
                id="join-can-drive"
                checked={canDrive}
                onCheckedChange={setCanDrive}
              />
            </div>
            {canDrive ? (
              <div className="space-y-2">
                <Label htmlFor="join-seats">可载人数</Label>
                <Input
                  id="join-seats"
                  type="number"
                  min={0}
                  max={50}
                  value={seats}
                  onChange={(event) => {
                    const n = Number(event.target.value);
                    setSeats(
                      Number.isFinite(n)
                        ? Math.min(50, Math.max(0, Math.trunc(n)))
                        : 0
                    );
                  }}
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={pending || !profileComplete}
              onClick={() => {
                if (user) {
                  void submit();
                } else {
                  setShowAuth(true);
                }
              }}
            >
              {pending ? "提交中..." : myMember ? "保存并进入控制台" : "加入并进入控制台"}
              <ArrowRight className="size-4" />
            </Button>
            {!profileComplete ? (
              <p className="text-xs text-muted-foreground">
                请选择你的出发地后再继续。
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>

      <PasswordAuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        supabase={supabase}
        onAuthSuccess={() => {
          setShowAuth(false);
          void submit();
        }}
      />
    </div>
  );
}

export function TripInviteClient({ inviteCode }: { inviteCode: string }) {
  return (
    <AMapProvider>
      <InviteInner inviteCode={inviteCode} />
    </AMapProvider>
  );
}
