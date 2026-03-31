import { getAuthenticatedUser } from "@/lib/auth-server";
import { autoAssignTrip } from "@/features/trip/server";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/auto-assign">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  try {
    const data = await autoAssignTrip(tripId, user.id);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "forbidden") {
      return Response.json({ error: "仅发起人可执行自动编组" }, { status: 403 });
    }
    if (message === "trip_closed") {
      return Response.json({ error: "行程已关闭" }, { status: 410 });
    }
    console.error(error);
    return Response.json({ error: "自动编组失败" }, { status: 500 });
  }
}
