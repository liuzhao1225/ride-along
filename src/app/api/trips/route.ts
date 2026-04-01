import { eventDateInputToIso } from "@/lib/activity-date";
import { createTrip } from "@/features/trip/server";
import {
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
  jsonError,
} from "@/features/trip/server/route-response";

export async function POST(request: Request) {
  return withAuthenticatedUser(async (user) => {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const { title, destination_name, destination_lat, destination_lng, trip_date } =
      body;

    if (!title || !destination_name || destination_lat == null || destination_lng == null) {
      return jsonError("缺少必填字段", 400);
    }

    let tripDateIso: string | null = null;
    if (typeof trip_date === "string" && trip_date.trim()) {
      tripDateIso =
        eventDateInputToIso(trip_date) ??
        (!Number.isNaN(new Date(trip_date).getTime())
          ? new Date(trip_date).toISOString()
          : null);
      if (!tripDateIso) {
        return jsonError("日期无效", 400);
      }
    }

    try {
      const trip = await createTrip({
        userId: user.id,
        title: String(title).trim(),
        destinationName: String(destination_name).trim(),
        destinationLat: Number(destination_lat),
        destinationLng: Number(destination_lng),
        tripDateIso,
        organizerDisplayName:
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          null,
      });
      return Response.json({ trip }, { status: 201 });
    } catch (error) {
      return mapRouteError(error, {}, "创建失败");
    }
  });
}
