"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { Car, Users, MapPin, Plus, LogIn, ChevronRight, UserRound } from "lucide-react";

export default function HomePage() {
  return <HomeContent />;
}

function HomeContent() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [pendingMe, setPendingMe] = useState(false);

  const [joinId, setJoinId] = useState("");
  const joinInputFilled = !!joinId.trim();

  function requireLoginForJoin() {
    if (user) handleJoin();
    else {
      setPendingJoin(true);
      setShowAuth(true);
    }
  }

  function handleJoin() {
    let id = joinId.trim();
    const match = id.match(/activity\/([a-zA-Z0-9_-]+)/);
    if (match) id = match[1];
    if (!id) return;
    router.push(`/activity/${id}`);
  }

  const displayName =
    (user?.user_metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "";

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
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Car className="size-6 shrink-0" />
            <h1 className="text-lg font-bold truncate">顺路拼车</h1>
          </div>
          <div className="flex items-center gap-3 text-sm shrink-0">
            {user ? (
              <>
                <span className="opacity-80 truncate max-w-[100px] hidden sm:inline">
                  {displayName}
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary-foreground opacity-80 underline-offset-4 hover:text-primary-foreground hover:underline"
                  onClick={() => supabase.auth.signOut()}
                >
                  退出
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary-foreground opacity-80 underline-offset-4 hover:text-primary-foreground hover:underline"
                onClick={() => setShowAuth(true)}
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              创建活动
            </CardTitle>
            <CardDescription>填写名称、时间与目的地</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/create"
              className={cn(
                buttonVariants(),
                "w-full inline-flex items-center justify-center gap-2"
              )}
            >
              前往创建
              <ChevronRight className="size-4" />
            </Link>
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
                if (e.key === "Enter") requireLoginForJoin();
              }}
            />
            <Button
              className={cn(
                "w-full transition-colors",
                joinInputFilled &&
                  "border-transparent bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 focus-visible:ring-emerald-600/50 dark:bg-emerald-600 dark:hover:bg-emerald-600/90"
              )}
              variant="outline"
              onClick={requireLoginForJoin}
              disabled={!joinInputFilled}
            >
              加入活动
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5" />
              我的活动
            </CardTitle>
            <CardDescription>查看你已加入的活动</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <Link
                href="/me"
                className={cn(
                  buttonVariants(),
                  "w-full inline-flex items-center justify-center gap-2"
                )}
              >
                前往查看
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setPendingMe(true);
                  setShowAuth(true);
                }}
              >
                前往查看
                <ChevronRight className="size-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-4 flex-wrap">
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

      <PasswordAuthDialog
        open={showAuth}
        onOpenChange={(open) => {
          setShowAuth(open);
          if (!open) {
            setPendingJoin(false);
            setPendingMe(false);
          }
        }}
        supabase={supabase}
        onAuthSuccess={() => {
          setShowAuth(false);
          if (pendingJoin) {
            setPendingJoin(false);
            handleJoin();
          }
          if (pendingMe) {
            setPendingMe(false);
            router.push("/me");
          }
        }}
      />
    </div>
  );
}
