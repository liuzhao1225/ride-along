import { createActivity } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { eventDateInputToIso } from "@/lib/activity-date";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, dest_name, dest_lat, dest_lng, event_at } = body;

  if (!name || !dest_name || dest_lat == null || dest_lng == null) {
    return Response.json({ error: "缺少必填字段" }, { status: 400 });
  }

  let eventAtIso: string | null = null;
  if (event_at != null && event_at !== "") {
    const raw = String(event_at).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const iso = eventDateInputToIso(raw);
      if (!iso) {
        return Response.json({ error: "活动日期无效" }, { status: 400 });
      }
      eventAtIso = iso;
    } else {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        return Response.json({ error: "活动日期无效" }, { status: 400 });
      }
      eventAtIso = d.toISOString();
    }
  }

  const creatorDisplayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    null;

  try {
    const activity = await createActivity(
      user.id,
      name,
      dest_name,
      dest_lat,
      dest_lng,
      eventAtIso,
      creatorDisplayName
    );
    return Response.json(activity, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "创建失败" }, { status: 500 });
  }
}
