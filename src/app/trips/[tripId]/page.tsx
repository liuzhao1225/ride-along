import { TripDashboardClient } from "@/features/trip/components/trip-dashboard-client";

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  return <TripDashboardClient tripId={tripId} />;
}
