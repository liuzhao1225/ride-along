import { closeTrip } from "@/features/trip/server";
import {
  mapRouteError,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/close">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    try {
      await closeTrip(tripId, user.id);
      return Response.json({ ok: true });
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          forbidden: { status: 403, error: "仅发起人可关闭行程" },
        },
        "关闭失败"
      );
    }
  });
}
