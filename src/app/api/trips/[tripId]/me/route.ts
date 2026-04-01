import { leaveTrip } from "@/features/trip/server";
import {
  mapRouteError,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/me">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    try {
      await leaveTrip(tripId, user.id);
      return Response.json({ ok: true });
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          organizer_cannot_leave: {
            status: 409,
            error: "发起人不能直接退出，请关闭行程",
          },
        },
        "退出失败"
      );
    }
  });
}
