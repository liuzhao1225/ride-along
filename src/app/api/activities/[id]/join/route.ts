import { getActivity, joinActivity } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/join">
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

  const body = await req.json();
  const nickname =
    typeof body.nickname === "string" && body.nickname.trim()
      ? body.nickname.trim()
      : (user.user_metadata?.display_name as string) ||
        user.email?.split("@")[0] ||
        "用户";

  try {
    const participant = await joinActivity(id, user.id, nickname);
    return Response.json(participant, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "activity_not_found") {
      return Response.json({ error: "活动不存在" }, { status: 404 });
    }
    if (msg === "activity_disbanded") {
      return Response.json({ error: "活动已解散，无法加入" }, { status: 410 });
    }
    console.error(e);
    return Response.json({ error: "加入失败" }, { status: 500 });
  }
}
