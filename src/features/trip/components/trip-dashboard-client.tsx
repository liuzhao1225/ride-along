"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AMapProvider } from "@/components/amap-loader";
import { PasswordAuthDialog } from "@/components/password-auth-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { getFetchJsonErrorMessage } from "../client/fetch-json";
import { tripClient } from "../client/trip-client";
import { useAuthDialogAction } from "../hooks/use-auth-dialog-action";
import { useTripDashboardData } from "../hooks/use-trip-dashboard-data";
import { buildTripInviteText, getMyRide } from "../model";
import { TripSummaryCard } from "./trip-summary-card";
import { AssignmentSection } from "./dashboard/assignment-section";
import { MyProfileSection } from "./dashboard/my-profile-section";
import { MyRideSection } from "./dashboard/my-ride-section";
import { TripDashboardLayout } from "./dashboard/trip-dashboard-layout";
import { TripPageHeader } from "./dashboard/trip-page-header";

function DashboardInner({ tripId }: { tripId: string }) {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const authDialog = useAuthDialogAction();
  const { data, loading, error, refresh, handleDataUpdated, setData } =
    useTripDashboardData(tripId);
  const [pendingAssign, setPendingAssign] = useState(false);
  const [pendingLeave, setPendingLeave] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [mobileSection, setMobileSection] = useState<"summary" | "assignments" | "mine">("mine");

  const myMember = useMemo(
    () => data?.members.find((member) => member.user_id === user?.id),
    [data, user]
  );
  const myRide = useMemo(
    () => getMyRide(myMember, data?.members ?? []),
    [myMember, data]
  );

  const isMyUnassigned =
    myMember != null &&
    myMember.has_car === 0 &&
    myMember.assigned_driver == null;
  const isOrganizer = user?.id != null && data?.trip.created_by === user.id;
  const isClosed = data?.status === "closed";
  const shouldJoinViaInvite =
    !authLoading &&
    !loading &&
    data != null &&
    user != null &&
    !myMember;
  const shouldFocusMyProfile =
    !authLoading &&
    !loading &&
    data != null &&
    user != null &&
    myMember != null;

  async function handleAutoAssign() {
    if (!data) return;
    setPendingAssign(true);
    try {
      const nextData = await tripClient.autoAssignTrip(data.trip.id, true);
      setData(nextData);
      toast.success(
        `自动编组完成：${nextData.stats.assignedPassengers} 人已上车，${nextData.stats.unassignedPassengers} 人未分配`
      );
    } catch (nextError) {
      toast.error(getFetchJsonErrorMessage(nextError, "自动编组失败"));
    } finally {
      setPendingAssign(false);
    }
  }

  async function handleLeave() {
    if (!data || !window.confirm("确定退出这趟行程？")) return;
    setPendingLeave(true);
    try {
      await tripClient.leaveTrip(data.trip.id);
      router.push("/");
    } catch (nextError) {
      toast.error(getFetchJsonErrorMessage(nextError, "退出失败"));
    } finally {
      setPendingLeave(false);
    }
  }

  async function handleCloseTrip() {
    if (!data || !window.confirm("确定关闭这趟行程？关闭后成员将只能查看。")) {
      return;
    }
    setPendingClose(true);
    try {
      await tripClient.closeTrip(data.trip.id);
      await refresh();
    } catch (nextError) {
      toast.error(getFetchJsonErrorMessage(nextError, "关闭失败"));
    } finally {
      setPendingClose(false);
    }
  }

  async function handleCopyInvite() {
    if (!data) return;

    const inviteLink = `${window.location.origin}/t/${tripId}`;
    const inviteText = buildTripInviteText(data.trip, inviteLink);

    try {
      await navigator.clipboard.writeText(inviteText);
      toast.success("邀请文案已复制");
    } catch {
      toast.error("复制失败，请手动复制邀请内容");
    }
  }

  const { openDialog, onOpenChange, onAuthSuccess } = authDialog;

  useEffect(() => {
    if (!authLoading && !user) {
      openDialog();
    }
  }, [authLoading, openDialog, user]);

  useEffect(() => {
    if (!shouldJoinViaInvite || !data) return;
    router.replace(`/t/${data.trip.id}?from=dashboard`);
  }, [data, shouldJoinViaInvite, router]);

  useEffect(() => {
    if (!shouldFocusMyProfile) return;
    setMobileSection("mine");
  }, [shouldFocusMyProfile]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{error ?? "行程不存在"}</p>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        正在等待登录...
      </div>
    );
  }

  if (shouldJoinViaInvite) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        正在跳转到资料填写页...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <TripPageHeader
        tripName={data.trip.name}
        closed={Boolean(isClosed)}
        supabase={supabase}
        showLogout={Boolean(user)}
        onCopyInvite={() => void handleCopyInvite()}
      />

      <TripDashboardLayout
        mobileSection={mobileSection}
        onMobileSectionChange={setMobileSection}
        renderSummarySection={() => (
          <TripSummaryCard
            data={data}
            editable={Boolean(isOrganizer)}
            onUpdated={handleDataUpdated}
          />
        )}
        renderAssignmentsSection={() => (
          <AssignmentSection
            trip={data.trip}
            members={data.members}
            currentUserId={user?.id}
            canManageAllAssignments={Boolean(isOrganizer)}
            interactionsDisabled={Boolean(isClosed)}
            autoAssignPending={pendingAssign}
            showAutoAssign={Boolean(myMember)}
            highlightUnassigned={Boolean(isMyUnassigned)}
            onAutoAssign={() => void handleAutoAssign()}
            onUpdated={refresh}
          />
        )}
        renderMyRideSection={() => (
          <MyRideSection
            myMember={myMember}
            myRide={myRide}
            description="个人只需要知道自己开车、坐谁的车，或者目前还未分配。"
          />
        )}
        renderMyProfileSection={() => (
          <MyProfileSection
            trip={data.trip}
            members={data.members}
            myMember={myMember}
            isOrganizer={Boolean(isOrganizer)}
            pendingDestructiveAction={isOrganizer ? pendingClose : pendingLeave}
            onDestructiveAction={isOrganizer ? handleCloseTrip : handleLeave}
            onUpdated={refresh}
          />
        )}
      />

      <PasswordAuthDialog
        open={authDialog.open}
        onOpenChange={onOpenChange}
        supabase={supabase}
        onAuthSuccess={onAuthSuccess}
      />
    </div>
  );
}

export function TripDashboardClient({ tripId }: { tripId: string }) {
  return (
    <AMapProvider>
      <DashboardInner tripId={tripId} />
    </AMapProvider>
  );
}
