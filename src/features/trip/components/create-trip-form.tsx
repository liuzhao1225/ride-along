"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, Car, MapPin } from "lucide-react";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AMapProvider } from "@/components/amap-loader";
import { LocationPicker, type Location } from "@/components/location-picker";
import {
  defaultEventDateInput,
  eventDateInputToIso,
} from "@/lib/activity-date";

export function CreateTripForm() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [title, setTitle] = useState("");
  const [tripDate, setTripDate] = useState(defaultEventDateInput);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTrip() {
    if (!user || !destination) return;
    const tripDateIso = eventDateInputToIso(tripDate);
    if (!tripDateIso) {
      setError("请输入有效日期");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          destination_name: destination.name,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          trip_date: tripDateIso,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "创建失败");
        return;
      }

      await fetch(`/api/trips/${data.trip.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname:
            (user.user_metadata?.display_name as string | undefined)?.trim() ||
            user.email?.split("@")[0] ||
            "发起人",
        }),
      });

      router.push(`/trips/${data.trip.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <AMapProvider>
      {loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          加载中...
        </div>
      ) : (
        <div className="flex flex-1 flex-col bg-muted/20">
          <header className="border-b bg-background/90 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
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
                  <div className="font-semibold">发起一趟拼车</div>
                  <div className="text-xs text-muted-foreground">
                    先定义目的地，再邀请成员补全资料
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>行程信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="trip-title">行程名称</Label>
                  <Input
                    id="trip-title"
                    placeholder="例如：周六早上去莫干山"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-date">出行日期</Label>
                  <div className="relative">
                    <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="trip-date"
                      className="pl-9"
                      type="date"
                      value={tripDate}
                      onChange={(event) => setTripDate(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>目的地</Label>
                  <LocationPicker
                    value={destination}
                    onChange={setDestination}
                    placeholder="搜索目的地..."
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                  disabled={!title.trim() || !destination || pending}
                  onClick={() => {
                    if (user) {
                      void createTrip();
                    } else {
                      setShowAuth(true);
                    }
                  }}
                >
                  {pending ? "创建中..." : "创建并进入控制台"}
                  <MapPin className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </main>

          <PasswordAuthDialog
            open={showAuth}
            onOpenChange={setShowAuth}
            supabase={supabase}
            onAuthSuccess={() => {
              setShowAuth(false);
              void createTrip();
            }}
          />
        </div>
      )}
    </AMapProvider>
  );
}
