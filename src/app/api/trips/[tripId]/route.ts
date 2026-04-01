import { eventDateInputToIso } from "@/lib/activity-date";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getTripDashboard, updateTrip } from "@/features/trip/server";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/trips/[tripId]">
) {
  const { tripId } = await ctx.params;
  try {
    const data = await getTripDashboard(tripId);
    if (!data) {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "加载失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]">
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { tripId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const destinationName = String(body.destination_name ?? "").trim();
  const destinationLat = Number(body.destination_lat);
  const destinationLng = Number(body.destination_lng);
  const tripDate = String(body.trip_date ?? "").trim();

  if (!title || !destinationName) {
    return Response.json({ error: "请填写名称和目的地" }, { status: 400 });
  }
  if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) {
    return Response.json({ error: "目的地无效" }, { status: 400 });
  }

  const tripDateIso = eventDateInputToIso(tripDate);
  if (!tripDateIso) {
    return Response.json({ error: "日期无效" }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "";
    if (message === "trip_not_found") {
      return Response.json({ error: "行程不存在" }, { status: 404 });
    }
    if (message === "forbidden") {
      return Response.json({ error: "仅发起人可编辑行程信息" }, { status: 403 });
    }
    if (message === "trip_closed") {
      return Response.json({ error: "行程已关闭" }, { status: 410 });
    }
    console.error(error);
    return Response.json({ error: "更新行程失败" }, { status: 500 });
  }
}
