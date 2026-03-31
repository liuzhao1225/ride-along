import {
  getActivity,
  getParticipants,
  clearAssignments,
  bulkAssignRides,
  isActivityDisbanded,
} from "@/lib/data";
import { autoAssign } from "@/lib/matching";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/assign">
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

  try {
    await clearAssignments(id);
    const participants = await getParticipants(id);
    const assignments = autoAssign(
      participants,
      activity.dest_lat,
      activity.dest_lng
    );
    if (assignments.length > 0) {
      await bulkAssignRides(assignments);
    }

    const updated = await getParticipants(id);
    return Response.json({
      participants: updated,
      assignments_made: assignments.length,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "分配失败" }, { status: 500 });
  }
}
