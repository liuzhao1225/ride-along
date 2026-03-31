import { AMapProvider } from "@/components/amap-loader";
import { ActivityLayoutClient } from "./activity-layout-client";

export default function ActivityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <AMapProvider>
      <ActivityLayoutClient params={params}>{children}</ActivityLayoutClient>
    </AMapProvider>
  );
}
