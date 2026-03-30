"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { AMapProvider } from "@/components/amap-loader";
import { RouteMap } from "@/components/route-map";
import { LocationPicker, type Location } from "@/components/location-picker";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Car,
  UserRound,
  Users,
  MapPin,
  ArrowLeft,
  Copy,
  Check,
  Shuffle,
  LogOut,
  LogIn,
  Minus,
  Plus,
} from "lucide-react";
import type { Activity, Participant } from "@/lib/db";

interface ActivityData {
  activity: Activity;
  participants: Participant[];
}

export default function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AMapProvider>
      <ActivityContent activityId={id} />
    </AMapProvider>
  );
}

function ActivityContent({ activityId }: { activityId: string }) {
  const router = useRouter();
  const { session, loaded: sessionLoaded, saveSession } = useSession();
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  const myParticipant = data?.participants.find(
    (p) => p.user_id === session?.userId
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities/${activityId}`);
      if (!res.ok) {
        setError("活动不存在");
        return;
      }
      const d = await res.json();
      setData(d);
      setError(null);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-join when session exists
  useEffect(() => {
    if (!session || !data || myParticipant) return;
    fetch(`/api/activities/${activityId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session.userId,
        nickname: session.nickname,
      }),
    }).then(() => fetchData());
  }, [session, data, myParticipant, activityId, fetchData]);

  // Show nickname dialog if no session
  useEffect(() => {
    if (sessionLoaded && !session && data) {
      setShowNickname(true);
    }
  }, [sessionLoaded, session, data]);

  function handleNicknameConfirm() {
    if (!nicknameInput.trim()) return;
    saveSession(nicknameInput.trim());
    setShowNickname(false);
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/activity/${activityId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !sessionLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4 mr-1" />
          返回首页
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { activity, participants } = data;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        activity={activity}
        activityId={activityId}
        onCopy={handleCopyLink}
        copied={copied}
        onBack={() => router.push("/")}
      />

      <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4 flex-1">
        <RouteMap
          activity={activity}
          participants={participants}
          currentUserId={session?.userId}
        />

        {myParticipant && session && (
          <MyInfoPanel
            participant={myParticipant}
            activityId={activityId}
            onUpdated={fetchData}
            destCenter={[activity.dest_lng, activity.dest_lat]}
          />
        )}

        <DriverList
          participants={participants}
          currentUserId={session?.userId}
          activityId={activityId}
          onUpdated={fetchData}
        />

        <UnassignedList
          participants={participants}
          currentUserId={session?.userId}
          activityId={activityId}
          onUpdated={fetchData}
        />

        <div className="pb-4">
          <Button
            className="w-full"
            onClick={async () => {
              await fetch(`/api/activities/${activityId}/assign`, {
                method: "POST",
              });
              fetchData();
            }}
          >
            <Shuffle className="size-4 mr-1" />
            自动分配乘客
          </Button>
        </div>
      </div>

      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置昵称</DialogTitle>
            <DialogDescription>
              输入你的昵称以加入活动
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="你的昵称"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNicknameConfirm();
              }}
              autoFocus
            />
            <Button
              className="w-full"
              onClick={handleNicknameConfirm}
              disabled={!nicknameInput.trim()}
            >
              确认加入
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({
  activity,
  activityId,
  onCopy,
  copied,
  onBack,
}: {
  activity: Activity;
  activityId: string;
  onCopy: () => void;
  copied: boolean;
  onBack: () => void;
}) {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon-sm" onClick={onBack} className="text-primary-foreground hover:bg-white/15">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold flex-1 truncate">
            {activity.name}
          </h1>
          <Button variant="ghost" size="sm" onClick={onCopy} className="text-primary-foreground hover:bg-white/15 border border-white/25">
            {copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            <span className="ml-1">{copied ? "已复制" : "分享"}</span>
          </Button>
        </div>
        <div className="flex items-center gap-1 text-sm opacity-80 ml-9">
          <MapPin className="size-3" />
          <span className="truncate">目的地: {activity.dest_name}</span>
          <Badge variant="outline" className="ml-auto text-xs shrink-0 border-white/25 text-primary-foreground">
            ID: {activityId}
          </Badge>
        </div>
      </div>
    </header>
  );
}

function MyInfoPanel({
  participant,
  activityId,
  onUpdated,
  destCenter,
}: {
  participant: Participant;
  activityId: string;
  onUpdated: () => void;
  destCenter: [number, number];
}) {
  const [hasCar, setHasCar] = useState(!!participant.has_car);
  const [seats, setSeats] = useState(participant.seats || 4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHasCar(!!participant.has_car);
    setSeats(participant.seats || 4);
  }, [participant.has_car, participant.seats]);

  async function updateField(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch(
        `/api/activities/${activityId}/participants/${participant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  function handleLocationChange(loc: Location) {
    updateField({
      location_name: loc.name,
      location_lat: loc.lat,
      location_lng: loc.lng,
    });
  }

  function handleCarToggle(checked: boolean) {
    setHasCar(checked);
    updateField({
      has_car: checked ? 1 : 0,
      seats: checked ? seats : 0,
    });
  }

  function handleSeatsChange(newSeats: number) {
    if (newSeats < 1 || newSeats > 50) return;
    setSeats(newSeats);
    updateField({ seats: newSeats });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="size-4" />
          我的信息
          <span className="text-sm font-normal text-muted-foreground">
            ({participant.nickname})
          </span>
          {saving && (
            <span className="text-xs text-muted-foreground ml-auto">
              保存中...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>我的出发地</Label>
          <LocationPicker
            value={
              participant.location_lat != null
                ? {
                    name: participant.location_name || "已选择",
                    lat: participant.location_lat,
                    lng: participant.location_lng!,
                  }
                : null
            }
            onChange={handleLocationChange}
            placeholder="搜索你的出发地..."
            center={destCenter}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="size-4" />
            <Label htmlFor="car-toggle">我有车</Label>
          </div>
          <Switch
            id="car-toggle"
            checked={hasCar}
            onCheckedChange={handleCarToggle}
          />
        </div>

        {hasCar && (
          <div className="flex items-center justify-between">
            <Label>可载人数（不含司机）</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleSeatsChange(seats - 1)}
                disabled={seats <= 1}
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-8 text-center font-medium">{seats}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleSeatsChange(seats + 1)}
                disabled={seats >= 50}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DriverList({
  participants,
  currentUserId,
  activityId,
  onUpdated,
}: {
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
}) {
  const drivers = participants.filter((p) => p.has_car);

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          <Car className="size-8 mx-auto mb-2 opacity-40" />
          暂无司机
        </CardContent>
      </Card>
    );
  }

  async function handleLeave(passengerId: string) {
    await fetch(`/api/activities/${activityId}/ride`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passenger_id: passengerId, driver_id: null }),
    });
    onUpdated();
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Car className="size-4" />
        车辆列表
      </h3>
      {drivers.map((driver) => {
        const passengers = participants.filter(
          (p) => p.assigned_driver === driver.id
        );
        const availableSeats = driver.seats - passengers.length;
        return (
          <Card key={driver.id}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-primary" />
                  <span className="font-medium">{driver.nickname}</span>
                  {driver.user_id === currentUserId && (
                    <Badge variant="secondary" className="text-xs">
                      我
                    </Badge>
                  )}
                </div>
                <Badge
                  variant={availableSeats > 0 ? "outline" : "secondary"}
                >
                  {passengers.length}/{driver.seats} 座
                </Badge>
              </div>
              {driver.location_name && (
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="size-3" />
                  出发: {driver.location_name}
                </p>
              )}
              {passengers.length > 0 && (
                <div className="space-y-1 ml-6">
                  {passengers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-1">
                        <UserRound className="size-3" />
                        {p.nickname}
                        {p.user_id === currentUserId && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1"
                          >
                            我
                          </Badge>
                        )}
                      </span>
                      {(p.user_id === currentUserId ||
                        driver.user_id === currentUserId) && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleLeave(p.id)}
                        >
                          <LogOut className="size-3" />
                          下车
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function UnassignedList({
  participants,
  currentUserId,
  activityId,
  onUpdated,
}: {
  participants: Participant[];
  currentUserId?: string;
  activityId: string;
  onUpdated: () => void;
}) {
  const unassigned = participants.filter(
    (p) => !p.has_car && !p.assigned_driver
  );
  const drivers = participants.filter((p) => p.has_car);

  async function handleBoard(passengerId: string, driverId: string) {
    await fetch(`/api/activities/${activityId}/ride`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passenger_id: passengerId, driver_id: driverId }),
    });
    onUpdated();
  }

  if (unassigned.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Users className="size-4" />
        未分配乘客 ({unassigned.length})
      </h3>
      <Card>
        <CardContent className="py-3 space-y-2">
          {unassigned.map((p) => {
            const isMe = p.user_id === currentUserId;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1 text-sm">
                  <UserRound className="size-3" />
                  {p.nickname}
                  {isMe && (
                    <Badge variant="secondary" className="text-[10px] px-1">
                      我
                    </Badge>
                  )}
                  {!p.location_lat && (
                    <span className="text-xs text-muted-foreground">
                      (未设置位置)
                    </span>
                  )}
                </span>
                {drivers.length > 0 && (
                  <div className="flex gap-1">
                    {drivers.map((d) => {
                      const pCount = participants.filter(
                        (pp) => pp.assigned_driver === d.id
                      ).length;
                      const full = pCount >= d.seats;
                      return (
                        <Button
                          key={d.id}
                          variant="outline"
                          size="xs"
                          disabled={full}
                          onClick={() => handleBoard(p.id, d.id)}
                          title={`上 ${d.nickname} 的车`}
                        >
                          <LogIn className="size-3" />
                          {d.nickname}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
