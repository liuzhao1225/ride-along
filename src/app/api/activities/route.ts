import { createActivity } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, dest_name, dest_lat, dest_lng } = body;

  if (!name || !dest_name || dest_lat == null || dest_lng == null) {
    return Response.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const activity = createActivity(name, dest_name, dest_lat, dest_lng);
  return Response.json(activity, { status: 201 });
}
