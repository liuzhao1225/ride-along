"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JoinTripPrompt({ tripId }: { tripId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>我的资料</CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={`/t/${tripId}`}>去邀请页加入并填写资料</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
