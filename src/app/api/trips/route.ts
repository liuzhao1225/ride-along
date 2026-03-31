import { eventDateInputToIso } from "@/lib/activity-date";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { createTrip } from "@/features/trip/server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { title, destination_name, destination_lat, destination_lng, trip_date } =
    body;

  if (!title || !destination_name || destination_lat == null || destination_lng == null) {
    return Response.json({ error: "缺少必填字段" }, { status: 400 });
  }

  let tripDateIso: string | null = null;
  if (typeof trip_date === "string" && trip_date.trim()) {
    tripDateIso =
      eventDateInputToIso(trip_date) ??
      (!Number.isNaN(new Date(trip_date).getTime())
        ? new Date(trip_date).toISOString()
        : null);
    if (!tripDateIso) {
      return Response.json({ error: "日期无效" }, { status: 400 });
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
    console.error(error);
    return Response.json({ error: "创建失败" }, { status: 500 });
  }
}
