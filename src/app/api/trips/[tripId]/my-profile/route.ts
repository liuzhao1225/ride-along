import { updateMyTripProfile } from "@/features/trip/server";
import {
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/my-profile">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);

    try {
      const member = await updateMyTripProfile({
        tripId,
        userId: user.id,
        updates: {
          nickname: body.nickname as string | undefined,
          location_name: body.location_name as string | null | undefined,
          location_lat: body.location_lat as number | null | undefined,
          location_lng: body.location_lng as number | null | undefined,
          has_car: body.has_car as number | undefined,
          seats: body.seats as number | undefined,
        },
      });
      return Response.json({ member });
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          trip_closed: { status: 410, error: "行程已关闭" },
          member_not_found: { status: 404, error: "请先加入行程" },
          location_required: { status: 400, error: "请先填写出发地" },
        },
        "保存失败"
      );
    }
  });
}
