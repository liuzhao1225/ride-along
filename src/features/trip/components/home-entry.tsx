"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Car, KeyRound, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { normalizeInviteCode } from "../model";
import { useAuthDialogAction } from "../hooks/use-auth-dialog-action";
import { LogoutButton } from "./logout-button";
import { PageHeader } from "./page-header";

export function HomeEntry() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const authDialog = useAuthDialogAction();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(33,115,70,0.12),transparent_38%),linear-gradient(180deg,#fafcf9_0%,#f2f5f1_100%)]">
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Car className="size-5" />
          </div>
        }
        title="顺路拼车"
        subtitle="临时出行编组工具"
        actions={
          user ? (
            <LogoutButton supabase={supabase} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => authDialog.openDialog()}
            >
              登录
            </Button>
          )
        }
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-2 space-y-4 lg:order-1 lg:space-y-5">
            <div className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              {"创建 -> 邀请 -> 填信息 -> 自动编组"}
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                一趟共同出行，只保留真正需要的拼车协调。
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                发起人创建一次行程，成员填写出发地和车辆信息，系统自动给出编组结果。页面只围绕这件事展开，不再混杂活动管理。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
              <span>单目的地</span>
              <span>低协作成本</span>
              <span>适合 20 人以内熟人局</span>
            </div>
          </section>

          <section className="order-1 space-y-4 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>发起一趟拼车</CardTitle>
                <CardDescription>先定义日期和目的地，再邀请成员补全资料。</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                  onClick={() => {
                    authDialog.requireAuth(Boolean(user), () => {
                      router.push("/trips/new");
                    });
                  }}
                >
                  前往发起
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>我的行程</CardTitle>
                <CardDescription>查看你已经参与的拼车单。</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    authDialog.requireAuth(Boolean(user), () => {
                      router.push("/trips");
                    });
                  }}
                >
                  查看我的行程
                  <Route className="size-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>输入邀请码</CardTitle>
                <CardDescription>支持直接粘贴邀请链接。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="邀请码或 /t/ 邀请链接"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!normalizeInviteCode(inviteCode)}
                  onClick={() => {
                    authDialog.requireAuth(Boolean(user), () => {
                      router.push(`/t/${normalizeInviteCode(inviteCode)}`);
                    });
                  }}
                >
                  进入邀请页
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <PasswordAuthDialog
        open={authDialog.open}
        onOpenChange={authDialog.onOpenChange}
        supabase={supabase}
        onAuthSuccess={authDialog.onAuthSuccess}
      />
    </div>
  );
}
