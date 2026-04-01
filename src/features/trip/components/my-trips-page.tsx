"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, MapPin, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import type { Trip } from "@/lib/types";
import { formatActivityDateDisplay } from "@/lib/activity-date";
import { getFetchJsonErrorMessage } from "../client/fetch-json";
import { tripClient } from "../client/trip-client";
import { useAuthDialogAction } from "../hooks/use-auth-dialog-action";
import { LogoutButton } from "./logout-button";
import { PageHeader } from "./page-header";

export function MyTripsPage() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const authDialog = useAuthDialogAction();
  const { openDialog, onOpenChange, onAuthSuccess } = authDialog;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      openDialog();
      setListLoading(false);
    }
  }, [loading, openDialog, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const json = await tripClient.listMine();
        if (!cancelled) {
          setTrips(json.trips ?? []);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(getFetchJsonErrorMessage(nextError, "加载失败"));
        }
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
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-muted/20">
        <PageHeader
          backHref="/"
          title="我的行程"
          subtitle="登录后查看你已加入的拼车行程"
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-sm text-muted-foreground">先登录，再查看你正在参与的行程。</p>
          <Button onClick={() => authDialog.openDialog()}>登录</Button>
        </div>
        <PasswordAuthDialog
          open={authDialog.open}
          onOpenChange={onOpenChange}
          supabase={supabase}
          onAuthSuccess={onAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <PageHeader
        backHref="/"
        title="我的行程"
        subtitle="你已经加入的拼车单"
        actions={<LogoutButton supabase={supabase} />}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-5 sm:py-6">
        {listLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">加载中...</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : trips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <Route className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="font-medium">你还没有参与任何行程</p>
                <p className="text-sm text-muted-foreground">可以从首页发起一趟新的拼车，或者通过邀请码加入。</p>
              </div>
              <Button onClick={() => router.push("/")}>返回首页</Button>
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id}>
              <Link href={`/trips/${trip.id}`} className="block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-3 text-base">
                    <span className="min-w-0 truncate">{trip.name}</span>
                    <div className="flex items-center gap-2">
                      {trip.disbanded_at != null ? (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          已关闭
                        </Badge>
                      ) : null}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </CardTitle>
                  <CardDescription className="space-y-1.5 pt-1 text-xs">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 shrink-0" />
                      {trip.dest_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 shrink-0" />
                      {formatActivityDateDisplay(trip.event_at) ?? "未设置日期"}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
