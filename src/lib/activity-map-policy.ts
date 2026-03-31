import type { Participant } from "@/lib/types";

/**
 * 路线地图：乘客可看；司机在已确认「我有车」后也可看。
 * 在仅有 has_car 0/1 的模型下，等价于已加入且登录即可。
 */
export function canShowActivityRouteMap(
  userId: string | undefined,
  myParticipant: Participant | undefined
): boolean {
  if (!userId || !myParticipant) return false;
  return myParticipant.has_car === 0 || myParticipant.has_car === 1;
}
