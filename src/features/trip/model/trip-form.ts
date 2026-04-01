import type { Trip } from "@/lib/types";
import {
  activitySecondsToDateInput,
  defaultEventDateInput,
  eventDateInputToIso,
} from "@/lib/activity-date";

export interface TripLocationValue {
  name: string;
  lat: number;
  lng: number;
}

export interface TripFormValue {
  title: string;
  tripDate: string;
  destination: TripLocationValue | null;
}

export function createEmptyTripFormValue(): TripFormValue {
  return {
    title: "",
    tripDate: defaultEventDateInput(),
    destination: null,
  };
}

export function buildTripFormValueFromTrip(trip: Trip): TripFormValue {
  return {
    title: trip.name,
    tripDate: activitySecondsToDateInput(trip.event_at),
    destination: {
      name: trip.dest_name,
      lat: trip.dest_lat,
      lng: trip.dest_lng,
    },
  };
}

export function getTripFormError(value: TripFormValue): string | null {
  if (!value.title.trim()) {
    return "请填写行程名称";
  }
  if (!value.destination) {
    return "请填写目的地";
  }
  if (!eventDateInputToIso(value.tripDate)) {
    return "请输入有效日期";
  }
  return null;
}

export function serializeTripFormValue(value: TripFormValue) {
  const tripDateIso = eventDateInputToIso(value.tripDate);

  return {
    title: value.title.trim(),
    destination_name: value.destination?.name ?? "",
    destination_lat: value.destination?.lat ?? 0,
    destination_lng: value.destination?.lng ?? 0,
    trip_date: tripDateIso ?? value.tripDate,
  };
}
