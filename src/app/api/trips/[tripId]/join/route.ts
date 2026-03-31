import { getAuthenticatedUser } from "@/lib/auth-server";
import { joinTrip } from "@/features/trip/server";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/join">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const nickname =
    typeof body.nickname === "string" && body.nickname.trim()
      ? body.nickname.trim()
      : (user.user_metadata?.display_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "成员";

  try {
    const member = await joinTrip(tripId, user.id, nickname);
    return Response.json({ member }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "activity_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "activity_disbanded") {
      return Response.json({ error: "行程已关闭，无法加入" }, { status: 410 });
    }
    console.error(error);
    return Response.json({ error: "加入失败" }, { status: 500 });
  }
}
