import { TripInviteClient } from "@/features/trip/components/trip-invite-client";

export default async function TripInvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  return <TripInviteClient inviteCode={inviteCode} />;
}
