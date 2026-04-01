import { autoAssignTrip } from "@/features/trip/server";
import {
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/auto-assign">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    try {
      const data = await autoAssignTrip({
        tripId,
        userId: user.id,
        releaseSelf: body.unlock_self !== false,
      });
      return Response.json(data);
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          forbidden: { status: 403, error: "请先加入行程" },
          trip_closed: { status: 410, error: "行程已关闭" },
        },
        "自动编组失败"
      );
    }
  });
}
