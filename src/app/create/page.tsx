"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { AMapProvider } from "@/components/amap-loader";
import { LocationPicker, type Location } from "@/components/location-picker";
import { Car, ArrowLeft } from "lucide-react";
import {
  defaultEventDateInput,
  eventDateInputToIso,
} from "@/lib/activity-date";

export default function CreateActivityPage() {
  return (
    <AMapProvider>
      <CreateContent />
    </AMapProvider>
  );
}

function CreateContent() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [pending, setPending] = useState(false);

  const [activityName, setActivityName] = useState("");
  const [destination, setDestination] = useState<Location | null>(null);
  const [eventAt, setEventAt] = useState(defaultEventDateInput);

  async function submit() {
    const { data: auth } = await supabase.auth.getUser();
    if (!activityName.trim() || !destination || !auth.user) return;
    const iso = eventDateInputToIso(eventAt);
    if (!iso) return;
    setPending(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activityName.trim(),
          dest_name: destination.name,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          event_at: iso,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/activity/${data.id}`);
      }
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="ghost"
            size="icon-sm"
            className="text-primary-foreground hover:bg-white/15"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Car className="size-6" />
            <h1 className="text-lg font-bold">创建活动</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>活动信息</CardTitle>
            <CardDescription>名称、日期与目的地</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">活动名称</Label>
              <Input
                id="create-name"
                placeholder="例如：周末自驾游"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-when">活动日期</Label>
              <Input
                id="create-when"
                type="date"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>目的地</Label>
              <LocationPicker
                value={destination}
                onChange={setDestination}
                placeholder="搜索目的地..."
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!user) {
                  setShowAuth(true);
                  return;
                }
                void submit();
              }}
              disabled={
                !activityName.trim() ||
                !destination ||
                !eventAt.trim() ||
                pending
              }
            >
              {pending ? "创建中..." : "创建活动"}
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
          void submit();
        }}
      />
    </div>
  );
}
