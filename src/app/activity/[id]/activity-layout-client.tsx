"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityDataContext } from "@/contexts/activity-data-context";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, ArrowLeft, Copy, Check } from "lucide-react";
import type { Activity, Participant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatActivityDateDisplay } from "@/lib/activity-date";

interface ActivityData {
  activity: Activity;
  participants: Participant[];
}

export function ActivityLayoutClient({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: activityId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, supabase } = useAuth();
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [disbanding, setDisbanding] = useState(false);
  const authPrompted = useRef(false);

  const myParticipant = data?.participants.find(
    (p) => p.user_id === user?.id
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!user || !data || myParticipant) return;
    if (data.activity.disbanded_at != null) return;
    const nickname =
      (user.user_metadata?.display_name as string) ||
      user.email?.split("@")[0] ||
      "用户";
    fetch(`/api/activities/${activityId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    }).then(() => fetchData());
  }, [user, data, myParticipant, activityId, fetchData]);

  useEffect(() => {
    if (!authLoading && !user && data && !authPrompted.current) {
      authPrompted.current = true;
      setShowAuth(true);
    }
  }, [authLoading, user, data]);

  useEffect(() => {
    if (user && showAuth) {
      setShowAuth(false);
      fetchData();
    }
  }, [user, showAuth, fetchData]);

  async function handleCopyLink() {
    const url = `${window.location.origin}/activity/${activityId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const base = `/activity/${activityId}`;

  const nav = [
    { href: base, label: "概览", match: (p: string) => p === base },
    {
      href: `${base}/roster`,
      label: "成员",
      match: (p: string) => p.startsWith(`${base}/roster`),
    },
    {
      href: `${base}/map`,
      label: "路线",
      match: (p: string) => p.startsWith(`${base}/map`),
    },
    {
      href: `${base}/me`,
      label: "我的信息",
      match: (p: string) => p.startsWith(`${base}/me`),
    },
  ];

  if (loading || authLoading) {
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

  const eventLabel = formatActivityDateDisplay(activity.event_at);
  const isDisbanded = activity.disbanded_at != null;
  const isCreator = user?.id === activity.created_by;

  async function handleDisband() {
    if (
      !window.confirm(
        "确定解散本活动？成员将无法再修改拼车信息，新用户也无法加入。"
      )
    ) {
      return;
    }
    setDisbanding(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/disband`, {
        method: "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((j as { error?: string }).error ?? "解散失败");
        return;
      }
      fetchData();
    } finally {
      setDisbanding(false);
    }
  }

  const ctxValue = {
    activityId,
    activity,
    participants,
    loading,
    error,
    refresh: fetchData,
    user,
    authLoading,
    myParticipant,
    supabase,
    showAuth,
    setShowAuth,
    isCreator,
    disbanding,
    disbandActivity: handleDisband,
  };

  return (
    <ActivityDataContext.Provider value={ctxValue}>
      <div className="flex flex-col min-h-full">
        <header className="bg-primary text-primary-foreground">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/")}
                className="text-primary-foreground hover:bg-white/15"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <h1 className="text-lg font-bold flex-1 truncate flex items-center gap-2">
                <span className="truncate">{activity.name}</span>
                {isDisbanded && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] border-white/30 bg-white/15"
                  >
                    已解散
                  </Badge>
                )}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="text-primary-foreground hover:bg-white/15 border border-white/25"
              >
                {copied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span className="ml-1">{copied ? "已复制" : "分享"}</span>
              </Button>
            </div>
            <div className="flex items-start gap-2 text-sm opacity-90 ml-9 pr-1">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <MapPin className="size-3.5 shrink-0 opacity-90" />
                <span className="truncate leading-snug">{activity.dest_name}</span>
              </div>
              <span className="shrink-0 text-xs leading-snug opacity-95 tabular-nums">
                {eventLabel ?? "未设日期"}
              </span>
            </div>
          </div>
        </header>

        {isDisbanded && (
          <div className="bg-destructive/15 text-destructive text-sm px-4 py-2.5 text-center border-b border-destructive/20">
            本活动已解散，仅可查看
          </div>
        )}

        <nav className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
          <div className="max-w-lg mx-auto px-3 py-2.5">
            <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 shadow-inner">
              {nav.map(({ href, label, match }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center rounded-lg px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs",
                    match(pathname)
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <span className="line-clamp-2">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="max-w-lg mx-auto w-full px-4 py-4 flex-1 pb-8">
          {children}
        </div>

        <PasswordAuthDialog
          open={showAuth}
          onOpenChange={setShowAuth}
          supabase={supabase}
        />
      </div>
    </ActivityDataContext.Provider>
  );
}
