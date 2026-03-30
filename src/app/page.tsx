"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { AMapProvider } from "@/components/amap-loader";
import { LocationPicker, type Location } from "@/components/location-picker";
import { Car, Users, MapPin, Plus, LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <AMapProvider>
      <HomeContent />
    </AMapProvider>
  );
}

function HomeContent() {
  const router = useRouter();
  const { session, loaded, saveSession } = useSession();
  const [showNickname, setShowNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(
    null
  );

  const [activityName, setActivityName] = useState("");
  const [destination, setDestination] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);

  const [joinId, setJoinId] = useState("");

  function requireNickname(action: "create" | "join") {
    if (session) {
      if (action === "create") handleCreate();
      else handleJoin();
    } else {
      setPendingAction(action);
      setShowNickname(true);
    }
  }

  function handleNicknameConfirm() {
    if (!nicknameInput.trim()) return;
    saveSession(nicknameInput.trim());
    setShowNickname(false);
    if (pendingAction === "create") {
      setTimeout(handleCreate, 50);
    } else if (pendingAction === "join") {
      setTimeout(handleJoin, 50);
    }
  }

  async function handleCreate() {
    if (!activityName.trim() || !destination) return;
    setCreating(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activityName.trim(),
          dest_name: destination.name,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/activity/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  function handleJoin() {
    let id = joinId.trim();
    // Support pasting full URL like /activity/xxx
    const match = id.match(/activity\/([a-zA-Z0-9_-]+)/);
    if (match) id = match[1];
    if (!id) return;
    router.push(`/activity/${id}`);
  }

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="size-6" />
            <h1 className="text-lg font-bold">顺路拼车</h1>
          </div>
          {session && (
            <span className="text-sm opacity-80">
              {session.nickname}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              创建活动
            </CardTitle>
            <CardDescription>设置活动名称和目的地</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name">活动名称</Label>
              <Input
                id="activity-name"
                placeholder="例如：周末自驾游"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
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
              onClick={() => requireNickname("create")}
              disabled={!activityName.trim() || !destination || creating}
            >
              {creating ? "创建中..." : "创建活动"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="size-5" />
              加入活动
            </CardTitle>
            <CardDescription>输入活动 ID 或粘贴分享链接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="活动 ID 或链接"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") requireNickname("join");
              }}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => requireNickname("join")}
              disabled={!joinId.trim()}
            >
              加入活动
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> 地图选点
            </span>
            <span className="flex items-center gap-1">
              <Car className="size-3" /> 自动匹配
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" /> 路线预览
            </span>
          </div>
        </div>
      </main>

      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置昵称</DialogTitle>
            <DialogDescription>
              输入你的昵称，方便大家认出你
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
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
