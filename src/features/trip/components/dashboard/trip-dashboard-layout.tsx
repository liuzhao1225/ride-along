"use client";

import type { ReactNode } from "react";
import { ClipboardList, Route, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mobileTabs = [
  { key: "summary" as const, label: "摘要", icon: ClipboardList },
  { key: "assignments" as const, label: "编组", icon: Route },
  { key: "mine" as const, label: "我的", icon: UserRound },
];

export function TripDashboardLayout({
  mobileSection,
  onMobileSectionChange,
  renderSummarySection,
  renderMyRideSection,
  renderAssignmentsSection,
  renderMyProfileSection,
}: {
  mobileSection: "summary" | "assignments" | "mine";
  onMobileSectionChange: (section: "summary" | "assignments" | "mine") => void;
  renderSummarySection: () => ReactNode;
  renderMyRideSection: () => ReactNode;
  renderAssignmentsSection: () => ReactNode;
  renderMyProfileSection: () => ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-6">
      <div className="hidden sm:block">{renderSummarySection()}</div>

      <section className="hidden gap-6 xl:grid xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {renderAssignmentsSection()}
          {renderMyRideSection()}
        </div>

        <div className="space-y-6">{renderMyProfileSection()}</div>
      </section>

      <section className="space-y-4 sm:hidden">
        <Tabs value={mobileSection} onValueChange={(value) => onMobileSectionChange(value as typeof mobileSection)}>
          <div className="sticky top-0 z-10 rounded-2xl border bg-background/90 p-1 backdrop-blur">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
              {mobileTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex h-auto flex-col gap-1 rounded-xl py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="summary" className="space-y-4">
            {renderSummarySection()}
            {renderMyRideSection()}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {renderAssignmentsSection()}
          </TabsContent>

          <TabsContent value="mine" className="space-y-4">
            {renderMyProfileSection()}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
