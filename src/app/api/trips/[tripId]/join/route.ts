import { joinTrip } from "@/features/trip/server";
import {
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/join">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId } = await ctx.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const nickname =
      typeof body.nickname === "string" && body.nickname.trim()
        ? body.nickname.trim()
        : (user.user_metadata?.display_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "成员";

    try {
      const member = await joinTrip(tripId, user.id, nickname);
      return Response.json({ member }, { status: 201 });
    } catch (error) {
      return mapRouteError(
        error,
        {
          activity_not_found: { status: 404, error: "行程不存在" },
          activity_disbanded: { status: 410, error: "行程已关闭，无法加入" },
        },
        "加入失败"
      );
    }
  });
}
