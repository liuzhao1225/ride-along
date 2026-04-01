"use client";

import { Copy } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../page-header";
import { LogoutButton } from "../logout-button";

export function TripPageHeader({
  tripName,
  closed,
  supabase,
  showLogout,
  onCopyInvite,
}: {
  tripName: string;
  closed: boolean;
  supabase: SupabaseClient;
  showLogout: boolean;
  onCopyInvite: () => void;
}) {
  return (
    <div>
      <PageHeader
        backHref="/"
        maxWidthClassName="max-w-6xl"
        title={tripName}
        titleClassName="truncate text-xl font-semibold leading-tight sm:text-base"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="size-11 rounded-2xl p-0 sm:h-9 sm:w-auto sm:px-3"
              onClick={onCopyInvite}
            >
              <Copy className="size-4" />
              <span className="hidden sm:inline">复制邀请</span>
            </Button>
            {showLogout ? (
              <LogoutButton
                supabase={supabase}
                className="size-11 rounded-2xl p-0 sm:h-9 sm:w-auto sm:px-3"
                compactLabel
              />
            ) : null}
          </>
        }
      />
      {closed ? (
        <div className="mx-auto hidden max-w-6xl px-4 pb-3 sm:block">
          <Badge variant="secondary">已关闭</Badge>
        </div>
      ) : null}
    </div>
  );
}
