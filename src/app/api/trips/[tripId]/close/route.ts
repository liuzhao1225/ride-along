import { getAuthenticatedUser } from "@/lib/auth-server";
import { closeTrip } from "@/features/trip/server";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/close">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  try {
    await closeTrip(tripId, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "forbidden") {
      return Response.json({ error: "仅发起人可关闭行程" }, { status: 403 });
    }
    console.error(error);
    return Response.json({ error: "关闭失败" }, { status: 500 });
  }
}
