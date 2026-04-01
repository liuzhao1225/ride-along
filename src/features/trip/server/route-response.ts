import type { User } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }
  return user;
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function mapRouteError(
  error: unknown,
  mappings: Record<string, { status: number; error: string }>,
  fallback: string
) {
  const message = error instanceof Error ? error.message : "";
  const mapped = mappings[message];
  if (mapped) {
    return jsonError(mapped.error, mapped.status);
  }
  console.error(error);
  return jsonError(fallback, 500);
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request
) {
  return (await request.json().catch(() => ({}))) as T;
}

export async function withAuthenticatedUser(
  action: (user: User) => Promise<Response>
) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return jsonError("请先登录", 401);
  }
  return action(user);
}
