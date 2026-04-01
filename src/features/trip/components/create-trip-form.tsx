"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, MapPin } from "lucide-react";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AMapProvider } from "@/components/amap-loader";
import { getFetchJsonErrorMessage } from "../client/fetch-json";
import { tripClient } from "../client/trip-client";
import { useAuthDialogAction } from "../hooks/use-auth-dialog-action";
import {
  createEmptyTripFormValue,
  getTripFormError,
  serializeTripFormValue,
  type TripFormValue,
} from "../model";
import { PageHeader } from "./page-header";
import { TripFormFields } from "./trip-form-fields";

export function CreateTripForm() {
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const authDialog = useAuthDialogAction();
  const [formValue, setFormValue] = useState<TripFormValue>(createEmptyTripFormValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTrip() {
    const formError = getTripFormError(formValue);
    if (formError) {
      setError(formError);
      return;
    }

    const currentUser =
      user ?? (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;

    setPending(true);
    setError(null);
    try {
      const payload = serializeTripFormValue(formValue);
      const data = await tripClient.createTrip(payload);
      await tripClient.joinTrip(
        data.trip.id,
        ((currentUser.user_metadata?.display_name as string | undefined)?.trim() ||
          currentUser.email?.split("@")[0] ||
          "发起人") as string
      );

      router.push(`/t/${data.trip.id}`);
    } catch (nextError) {
      setError(getFetchJsonErrorMessage(nextError, "创建失败"));
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
          <PageHeader
            backHref="/"
            maxWidthClassName="max-w-3xl"
            icon={
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Car className="size-5" />
              </div>
            }
            title="发起一趟拼车"
            subtitle="先定义目的地，再邀请成员补全资料"
          />

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 sm:py-8">
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>行程信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <TripFormFields value={formValue} onChange={setFormValue} />

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                  disabled={!formValue.title.trim() || !formValue.destination || pending}
                  onClick={() => {
                    authDialog.requireAuth(Boolean(user), createTrip);
                  }}
                >
                  {pending ? "创建中..." : "创建并进入控制台"}
                  <MapPin className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </main>

          <PasswordAuthDialog
            open={authDialog.open}
            onOpenChange={authDialog.onOpenChange}
            supabase={supabase}
            onAuthSuccess={authDialog.onAuthSuccess}
          />
        </div>
      )}
    </AMapProvider>
  );
}
