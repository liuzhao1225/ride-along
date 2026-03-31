import {
  assignRide,
  getActivity,
  getParticipants,
  getParticipantById,
  isActivityDisbanded,
} from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/ride">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const activity = await getActivity(id);
  if (!activity) {
    return Response.json({ error: "活动不存在" }, { status: 404 });
  }
  if (isActivityDisbanded(activity)) {
    return Response.json({ error: "活动已解散" }, { status: 410 });
  }

  const body = await req.json();
  const { passenger_id, driver_id } = body;

  if (!passenger_id) {
    return Response.json({ error: "缺少 passenger_id" }, { status: 400 });
  }

  const passenger = await getParticipantById(passenger_id);
  if (!passenger || passenger.activity_id !== id) {
    return Response.json({ error: "乘客不存在" }, { status: 404 });
  }

  const participants = await getParticipants(id);
  const driverParticipant =
    passenger.assigned_driver != null
      ? participants.find((p) => p.id === passenger.assigned_driver)
      : null;

  if (driver_id === null) {
    const isPassengerSelf = passenger.user_id === user.id;
    const isAssignedDriver =
      driverParticipant != null && driverParticipant.user_id === user.id;
    if (!isPassengerSelf && !isAssignedDriver) {
      return Response.json({ error: "无权操作" }, { status: 403 });
    }
  } else {
    if (passenger.user_id !== user.id) {
      return Response.json({ error: "无权操作" }, { status: 403 });
    }
    const targetDriver = participants.find((p) => p.id === driver_id);
    if (!targetDriver?.has_car) {
      return Response.json({ error: "无效的司机" }, { status: 400 });
    }
  }

  try {
    await assignRide(passenger_id, driver_id ?? null);
    const updated = await getParticipants(id);
    return Response.json({ participants: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}
