import { getActivity, getParticipants, clearAssignments, bulkAssignRides } from "@/lib/db";
import { autoAssign } from "@/lib/matching";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/activities/[id]/assign">
) {
  const { id } = await ctx.params;
  const activity = getActivity(id);
  if (!activity) {
    return Response.json({ error: "活动不存在" }, { status: 404 });
  }

  clearAssignments(id);
  const participants = getParticipants(id);
  const assignments = autoAssign(
    participants,
    activity.dest_lat,
    activity.dest_lng
  );
  if (assignments.length > 0) {
    bulkAssignRides(assignments);
  }

  const updated = getParticipants(id);
  return Response.json({ participants: updated, assignments_made: assignments.length });
}
