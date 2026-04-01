"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AssignmentMemberRow({
  title,
  subtitle,
  meta,
  actions,
  dashed = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2",
        dashed && "border-dashed"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm">{title}</div>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {meta || actions ? (
        <div className="flex shrink-0 items-center gap-2">
          {meta}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
