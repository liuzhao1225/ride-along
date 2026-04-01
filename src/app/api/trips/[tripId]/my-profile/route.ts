import { getAuthenticatedUser } from "@/lib/auth-server";
import { updateMyTripProfile } from "@/features/trip/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/my-profile">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  try {
    const member = await updateMyTripProfile({
      tripId,
      userId: user.id,
      updates: {
        nickname: body.nickname,
        location_name: body.location_name,
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        has_car: body.has_car,
        seats: body.seats,
      },
    });
    return Response.json({ member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "trip_closed") {
      return Response.json({ error: "行程已关闭" }, { status: 410 });
    }
    if (message === "member_not_found") {
      return Response.json({ error: "请先加入行程" }, { status: 404 });
    }
    if (message === "location_required") {
      return Response.json({ error: "请先填写出发地" }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "保存失败" }, { status: 500 });
  }
}
