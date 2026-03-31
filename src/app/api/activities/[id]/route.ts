import { getActivity, getParticipants } from "@/lib/data";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]">
) {
  const { id } = await ctx.params;
  try {
    const activity = await getActivity(id);
    if (!activity) {
      return Response.json({ error: "活动不存在" }, { status: 404 });
    }
    const participants = await getParticipants(id);
    return Response.json({ activity, participants });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "加载失败" }, { status: 500 });
  }
}
