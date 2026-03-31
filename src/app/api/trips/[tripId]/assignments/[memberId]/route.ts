import { getAuthenticatedUser } from "@/lib/auth-server";
import { setTripAssignment } from "@/features/trip/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/assignments/[memberId]">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId, memberId } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  try {
    const data = await setTripAssignment({
      tripId,
      organizerUserId: user.id,
      passengerMemberId: memberId,
      driverMemberId:
        typeof body.driver_member_id === "string" ? body.driver_member_id : null,
    });
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "forbidden") {
      return Response.json({ error: "仅发起人可调整编组" }, { status: 403 });
    }
    if (message === "trip_closed") {
      return Response.json({ error: "行程已关闭" }, { status: 410 });
    }
    if (message === "invalid_passenger" || message === "invalid_driver") {
      return Response.json({ error: "成员信息无效" }, { status: 400 });
    }
    if (message === "driver_full") {
      return Response.json({ error: "该司机已满座" }, { status: 409 });
    }
    console.error(error);
    return Response.json({ error: "调整失败" }, { status: 500 });
  }
}
