import { getTripDashboard } from "@/features/trip/server";

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
