import { setTripAssignment } from "@/features/trip/server";
import {
  mapRouteError,
  parseJsonBody,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/trips/[tripId]/assignments/[memberId]">
) {
  return withAuthenticatedUser(async (user) => {
    const { tripId, memberId } = await ctx.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);

    try {
      const data = await setTripAssignment({
        tripId,
        actorUserId: user.id,
        passengerMemberId: memberId,
        driverMemberId:
          typeof body.driver_member_id === "string" ? body.driver_member_id : null,
      });
      return Response.json(data);
    } catch (error) {
      return mapRouteError(
        error,
        {
          trip_not_found: { status: 404, error: "行程不存在" },
          forbidden: { status: 403, error: "你没有权限调整该成员" },
          trip_closed: { status: 410, error: "行程已关闭" },
          invalid_passenger: { status: 400, error: "成员信息无效" },
          invalid_driver: { status: 400, error: "成员信息无效" },
          driver_full: { status: 409, error: "该司机已满座" },
        },
        "调整失败"
      );
    }
  });
}
