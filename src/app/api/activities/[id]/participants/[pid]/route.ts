import { updateParticipant } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/participants/[pid]">
) {
  const { pid } = await ctx.params;
  const body = await req.json();

  const allowed = [
    "location_name",
    "location_lat",
    "location_lng",
    "has_car",
    "seats",
    "nickname",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const participant = updateParticipant(pid, updates);
  if (!participant) {
    return Response.json({ error: "参与者不存在" }, { status: 404 });
  }
  return Response.json(participant);
}
