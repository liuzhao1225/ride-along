import { listTripsForUser } from "@/features/trip/server";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const trips = await listTripsForUser(user.id);
    return Response.json({ trips });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "加载失败" }, { status: 500 });
  }
}
