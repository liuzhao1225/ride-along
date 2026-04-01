import { listTripsForUser } from "@/features/trip/server";
import {
  mapRouteError,
  withAuthenticatedUser,
} from "@/features/trip/server/route-response";

export async function GET() {
  return withAuthenticatedUser(async (user) => {
    try {
      const trips = await listTripsForUser(user.id);
      return Response.json({ trips });
    } catch (error) {
      return mapRouteError(error, {}, "加载失败");
    }
  });
}
