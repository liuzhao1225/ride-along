import { getAuthenticatedUser } from "@/lib/auth-server";
import { leaveTrip } from "@/features/trip/server";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/me">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  try {
    await leaveTrip(tripId, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "organizer_cannot_leave") {
      return Response.json({ error: "发起人不能直接退出，请关闭行程" }, { status: 409 });
    }
    console.error(error);
    return Response.json({ error: "退出失败" }, { status: 500 });
  }
}
