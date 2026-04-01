"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  backHref,
  icon,
  title,
  subtitle,
  actions,
  maxWidthClassName = "max-w-4xl",
  titleClassName,
}: {
  backHref?: string;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  maxWidthClassName?: string;
  titleClassName?: string;
}) {
  return (
    <header className="border-b bg-background/90 backdrop-blur">
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-3 px-4 py-4",
          maxWidthClassName
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          ) : null}
          <div className="flex min-w-0 items-center gap-2">
            {icon ? icon : null}
            <div className="min-w-0">
              <div className={cn("font-semibold", titleClassName)}>{title}</div>
              {subtitle ? (
                <div className="text-xs text-muted-foreground">{subtitle}</div>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
