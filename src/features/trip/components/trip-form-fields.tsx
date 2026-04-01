"use client";

import { CalendarRange, MapPin } from "lucide-react";
import { LocationPicker } from "@/components/location-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TripFormValue, TripLocationValue } from "../model";

export function TripFormFields({
  value,
  disabled = false,
  locationCenter,
  idPrefix = "trip-form",
  onChange,
}: {
  value: TripFormValue;
  disabled?: boolean;
  locationCenter?: [number, number];
  idPrefix?: string;
  onChange: (nextValue: TripFormValue) => void;
}) {
  function updateValue(patch: Partial<TripFormValue>) {
    onChange({
      ...value,
      ...patch,
    });
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>行程名称</Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="例如：周六早上去莫干山"
          value={value.title}
          disabled={disabled}
          onChange={(event) => updateValue({ title: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>出行日期</Label>
        <div className="relative">
          <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${idPrefix}-date`}
            className="pl-9"
            type="date"
            value={value.tripDate}
            disabled={disabled}
            onChange={(event) => updateValue({ tripDate: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>目的地</Label>
        <LocationPicker
          value={value.destination}
          onChange={(destination) =>
            updateValue({ destination: destination as TripLocationValue | null })
          }
          placeholder="搜索目的地..."
          center={locationCenter}
          disabled={disabled}
        />
      </div>

      {value.destination ? (
        <p className="text-xs text-muted-foreground">
          <MapPin className="mr-1 inline size-3" />
          当前目的地：{value.destination.name}
        </p>
      ) : null}
    </>
  );
}
