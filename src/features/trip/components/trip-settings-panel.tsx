"use client";

import { useEffect, useState } from "react";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Trip } from "@/lib/types";
import { getFetchJsonErrorMessage } from "../client/fetch-json";
import { tripClient } from "../client/trip-client";
import {
  buildTripFormValueFromTrip,
  getTripFormError,
  serializeTripFormValue,
  type TripFormValue,
} from "../model";
import type { TripDashboardData } from "../types";
import { TripFormFields } from "./trip-form-fields";

export function TripSettingsPanel({
  trip,
  onUpdated,
  onSaved,
  embedded = false,
}: {
  trip: Trip;
  onUpdated: (data?: TripDashboardData) => void;
  onSaved?: () => void;
  embedded?: boolean;
}) {
  const [formValue, setFormValue] = useState<TripFormValue>(
    buildTripFormValueFromTrip(trip)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValue(buildTripFormValueFromTrip(trip));
  }, [trip]);

  const closed = trip.disbanded_at != null;

  async function handleSave() {
    const formError = getTripFormError(formValue);
    if (formError) {
      setError(formError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const json = await tripClient.updateTrip(
        trip.id,
        serializeTripFormValue(formValue)
      );

      toast.success("行程信息已更新");
      onUpdated(json as TripDashboardData);
      onSaved?.();
    } catch (nextError) {
      setError(getFetchJsonErrorMessage(nextError, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <>
      {!embedded ? (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PencilLine className="size-4" />
            行程信息
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={embedded ? "space-y-4 p-0 pt-0" : "space-y-4"}>
        {closed ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            行程已关闭，无法修改活动信息。
          </p>
        ) : null}

        <TripFormFields
          value={formValue}
          disabled={closed}
          locationCenter={[trip.dest_lng, trip.dest_lat]}
          idPrefix="trip-settings"
          onChange={setFormValue}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          className="w-full"
          disabled={closed || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "保存中..." : "保存行程信息"}
        </Button>
      </CardContent>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      {content}
    </Card>
  );
}
