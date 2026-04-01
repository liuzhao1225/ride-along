"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AssignmentCard({
  title,
  summary,
  expanded,
  highlighted = false,
  onToggle,
  children,
}: {
  title: ReactNode;
  summary: ReactNode;
  expanded: boolean;
  highlighted?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <Card className={cn(highlighted && "border-emerald-200 bg-emerald-50/70")}>
      <CardContent className="py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span className="min-w-0 truncate font-medium">{title}</span>
          <span className="flex shrink-0 items-center gap-2">
            {summary}
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </span>
        </button>

        {expanded ? <div className="mt-4 space-y-4 border-t pt-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
