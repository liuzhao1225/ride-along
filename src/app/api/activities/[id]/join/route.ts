import { getActivity, joinActivity } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/join">
) {
  const { id } = await ctx.params;
  const activity = getActivity(id);
  if (!activity) {
    return Response.json({ error: "活动不存在" }, { status: 404 });
  }

  const body = await req.json();
  const { user_id, nickname } = body;
  if (!user_id || !nickname) {
    return Response.json({ error: "缺少 user_id 或 nickname" }, { status: 400 });
  }

  const participant = joinActivity(id, user_id, nickname);
  return Response.json(participant, { status: 201 });
}
