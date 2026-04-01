import type { TripMember } from "@/lib/types";

export function sortPassengersForDisplay(members: TripMember[]) {
  return [...members].sort((left, right) => {
    const leftOrder = left.pickup_order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.pickup_order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.created_at - right.created_at;
  });
}

export function getMyDriverId(
  currentUserId: string | undefined,
  members: TripMember[]
) {
  const myMember = members.find((member) => member.user_id === currentUserId);
  if (!myMember) return null;
  return myMember.has_car === 1 ? myMember.id : myMember.assigned_driver;
}

export function sortDriversByMyGroup(
  drivers: TripMember[],
  currentUserId: string | undefined,
  members: TripMember[]
) {
  const myDriverId = getMyDriverId(currentUserId, members);
  if (!myDriverId) return drivers;

  return [...drivers].sort((left, right) => {
    if (left.id === myDriverId) return -1;
    if (right.id === myDriverId) return 1;
    return 0;
  });
}

export function getDriverPassengersMap(
  drivers: TripMember[],
  members: TripMember[]
) {
  const grouped = new Map<string, TripMember[]>();

  for (const driver of drivers) {
    grouped.set(driver.id, []);
  }

  for (const member of members) {
    if (member.assigned_driver && grouped.has(member.assigned_driver)) {
      grouped.get(member.assigned_driver)?.push(member);
    }
  }

  for (const [driverId, driverMembers] of grouped.entries()) {
    grouped.set(driverId, sortPassengersForDisplay(driverMembers));
  }

  return grouped;
}

export function countAssignedPassengers(driverId: string, members: TripMember[]) {
  return members.filter((member) => member.assigned_driver === driverId).length;
}

export function getUnassignedReason(
  passenger: TripMember,
  drivers: TripMember[],
  members: TripMember[]
) {
  const totalAvailableSeats = drivers.reduce((sum, driver) => {
    return (
      sum + Math.max(driver.seats - countAssignedPassengers(driver.id, members), 0)
    );
  }, 0);

  if (!passenger.is_free_agent) {
    return "已手动下车，自动编组会跳过";
  }
  if (passenger.location_lat == null || passenger.location_lng == null) {
    return "未设置位置";
  }
  if (drivers.length === 0) {
    return "暂无司机";
  }
  if (totalAvailableSeats <= 0) {
    return "座位不足";
  }
  return "等待编组";
}
