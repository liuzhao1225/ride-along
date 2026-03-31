import {
  updateParticipant,
  getParticipantById,
  getActivity,
  isActivityDisbanded,
} from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/participants/[pid]">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: activityId, pid } = await ctx.params;
  const body = await req.json();

  const participant = await getParticipantById(pid);
  if (!participant) {
    return Response.json({ error: "参与者不存在" }, { status: 404 });
  }
  if (participant.activity_id !== activityId) {
    return Response.json({ error: "参与者不存在" }, { status: 404 });
  }
  const activity = await getActivity(activityId);
  if (!activity) {
    return Response.json({ error: "活动不存在" }, { status: 404 });
  }
  if (isActivityDisbanded(activity)) {
    return Response.json({ error: "活动已解散" }, { status: 410 });
  }
  if (participant.user_id !== user.id) {
    return Response.json({ error: "无权修改" }, { status: 403 });
  }

  const allowed = [
    "location_name",
    "location_lat",
    "location_lng",
    "has_car",
    "seats",
    "nickname",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  try {
    const updated = await updateParticipant(pid, updates);
    if (!updated) {
      return Response.json({ error: "参与者不存在" }, { status: 404 });
    }
    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}
