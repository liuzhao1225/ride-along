import { eventDateInputToIso } from "@/lib/activity-date";
import { getTripDashboard, updateTrip } from "@/features/trip/server";
import {
  jsonError,
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]">
) {
  const { tripId } = await ctx.params;
  try {
    const data = await getTripDashboard(tripId);
    if (!data) {
      return jsonError("行程不存在", 404);
    }
    return Response.json(data);
  } catch (error) {
    return mapRouteError(error, {}, "加载失败");
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const title = String(body.title ?? "").trim();
    const destinationName = String(body.destination_name ?? "").trim();
    const destinationLat = Number(body.destination_lat);
    const destinationLng = Number(body.destination_lng);
    const tripDate = String(body.trip_date ?? "").trim();

    if (!title || !destinationName) {
      return jsonError("请填写名称和目的地", 400);
    }
    if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) {
      return jsonError("目的地无效", 400);
    }

    const tripDateIso = eventDateInputToIso(tripDate);
    if (!tripDateIso) {
      return jsonError("日期无效", 400);
    }

    try {
      const data = await updateTrip({
        tripId,
        userId: user.id,
        updates: {
          title,
          destinationName,
          destinationLat,
          destinationLng,
          tripDateIso,
        },
      });
      return Response.json(data);
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          forbidden: { status: 403, error: "仅发起人可编辑行程信息" },
          trip_closed: { status: 410, error: "行程已关闭" },
        },
        "更新行程失败"
      );
    }
  });
}
