import { assignRide, getParticipants } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/ride">
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { passenger_id, driver_id } = body;

  if (!passenger_id) {
    return Response.json({ error: "缺少 passenger_id" }, { status: 400 });
  }

  assignRide(passenger_id, driver_id ?? null);

  const participants = getParticipants(id);
  return Response.json({ participants });
}
