import { getActivity, getParticipants } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]">
) {
  const { id } = await ctx.params;
  const activity = getActivity(id);
  if (!activity) {
    return Response.json({ error: "活动不存在" }, { status: 404 });
  }
  const participants = getParticipants(id);
  return Response.json({ activity, participants });
}
