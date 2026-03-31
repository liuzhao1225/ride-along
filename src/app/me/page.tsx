"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { Car, ArrowLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import type { Activity } from "@/lib/types";
import { formatActivityDateDisplay } from "@/lib/activity-date";

export default function MePage() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) {
      setListLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const res = await fetch("/api/me/activities");
        if (!res.ok) {
          if (!cancelled) setLoadError("加载失败");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setActivities(data.activities ?? []);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) setLoadError("网络错误");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!user) {
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
            <h1 className="text-lg font-bold">我的活动</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-muted-foreground text-sm text-center">
            登录后查看你加入的活动
          </p>
          <Button onClick={() => setShowAuth(true)}>登录</Button>
        </div>
        <PasswordAuthDialog
          open={showAuth}
          onOpenChange={setShowAuth}
          supabase={supabase}
          onAuthSuccess={() => setShowAuth(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground hover:bg-white/15 shrink-0"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-lg font-bold truncate">我的活动</h1>
          </div>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm text-primary-foreground opacity-80 underline-offset-4 hover:text-primary-foreground hover:underline shrink-0"
            onClick={() => supabase.auth.signOut()}
          >
            退出
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        {listLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            加载中…
          </p>
        ) : loadError ? (
          <p className="text-sm text-destructive text-center py-8">{loadError}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            暂无已加入的活动
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <Card key={a.id}>
                <Link href={`/activity/${a.id}`} className="block">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{a.name}</span>
                        {a.disbanded_at != null ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            已解散
                          </Badge>
                        ) : null}
                      </span>
                      <ChevronRight className="size-4 shrink-0 opacity-40 mt-0.5" />
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin className="size-3 shrink-0" />
                        {a.dest_name}
                      </span>
                      {formatActivityDateDisplay(a.event_at) ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Calendar className="size-3 shrink-0" />
                          {formatActivityDateDisplay(a.event_at)}
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/")}
        >
          <Car className="size-4 mr-1" />
          返回首页
        </Button>
      </main>
    </div>
  );
}
