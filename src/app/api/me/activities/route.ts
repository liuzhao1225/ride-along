import { listActivitiesForUser } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const activities = await listActivitiesForUser(user.id);
    return Response.json({ activities });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "加载失败" }, { status: 500 });
  }
}
