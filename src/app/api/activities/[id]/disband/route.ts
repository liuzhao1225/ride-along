import { disbandActivity } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/disband">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const result = await disbandActivity(id, user.id);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return Response.json({ error: "活动不存在" }, { status: 404 });
      }
      return Response.json({ error: "仅创建者可解散活动" }, { status: 403 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "解散失败" }, { status: 500 });
  }
}
