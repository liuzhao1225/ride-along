/* eslint-disable @typescript-eslint/no-explicit-any -- AMap SDK */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAMap } from "./amap-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import {
  MAP_DOT_GREEN,
  MAP_DOT_RED,
  MAP_DOT_NEUTRAL,
  createPersonDotElement,
  mapDotMarkerOffsetPx,
} from "@/lib/amap-dot-style";

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value?: Location | null;
  onChange: (loc: Location) => void;
  placeholder?: string;
  center?: [number, number];
  /** 人员点颜色：有车/已上车绿，未上车红，其它灰 */
  personMarkerTint?: "green" | "red" | "neutral";
  /** 只读（如活动已解散） */
  disabled?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "搜索地点...",
  center,
  personMarkerTint = "neutral",
  disabled = false,
}: LocationPickerProps) {
  const { loaded, AMap } = useAMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const autoCompleteRef = useRef<any>(null);

  const tintColor =
    personMarkerTint === "green"
      ? MAP_DOT_GREEN
      : personMarkerTint === "red"
        ? MAP_DOT_RED
        : MAP_DOT_NEUTRAL;

  const setMarkerAt = useCallback(
    (lng: number, lat: number, map: any) => {
      if (!AMap) return;
      const el = createPersonDotElement(tintColor);
      const [ox, oy] = mapDotMarkerOffsetPx();
      if (markerRef.current) {
        map.remove(markerRef.current);
        markerRef.current = null;
      }
      markerRef.current = new AMap.Marker({
        position: [lng, lat],
        map,
        content: el,
        offset: new AMap.Pixel(ox, oy),
      });
    },
    [AMap, tintColor]
  );

  const initMap = useCallback(() => {
    if (!AMap || !mapRef.current || mapInstance.current) return;
    const defaultCenter = center || [116.397428, 39.90923];
    const map = new AMap.Map(mapRef.current, {
      zoom: 13,
      center: value
        ? [value.lng, value.lat]
        : defaultCenter,
    });
    mapInstance.current = map;

    if (value) {
      setMarkerAt(value.lng, value.lat, map);
    }

    map.on("click", (e: any) => {
      if (disabled) return;
      const lnglat = e.lnglat;
      setMarkerAt(lnglat.getLng(), lnglat.getLat(), map);
      const geocoder = new AMap.Geocoder();
      geocoder.getAddress(lnglat, (status: string, result: any) => {
        const name =
          status === "complete"
            ? result.regeocode?.formattedAddress || "选中位置"
            : "选中位置";
        onChange({ name, lat: lnglat.getLat(), lng: lnglat.getLng() });
      });
    });
  }, [AMap, center, value, onChange, setMarkerAt, disabled]);

  useEffect(() => {
    if (loaded && showMap) {
      setTimeout(initMap, 100);
    }
  }, [loaded, showMap, initMap]);

  useEffect(() => {
    if (!showMap && mapInstance.current) {
      try {
        mapInstance.current.destroy();
      } catch {
        /* ignore */
      }
      mapInstance.current = null;
      markerRef.current = null;
    }
  }, [showMap]);

  useEffect(() => {
    if (!loaded || !showMap || !mapInstance.current || !value || !AMap) return;
    setMarkerAt(value.lng, value.lat, mapInstance.current);
  }, [
    loaded,
    showMap,
    value?.lat,
    value?.lng,
    tintColor,
    AMap,
    setMarkerAt,
    value,
  ]);

  useEffect(() => {
    if (!AMap) return;
    autoCompleteRef.current = new AMap.AutoComplete({ city: "全国" });
  }, [AMap]);

  const handleSearch = useCallback(() => {
    if (!autoCompleteRef.current || !query.trim()) {
      setSuggestions([]);
      return;
    }
    autoCompleteRef.current.search(query, (status: string, result: any) => {
      if (status === "complete" && result.tips) {
        setSuggestions(
          result.tips.filter((t: any) => t.location).slice(0, 6)
        );
      } else {
        setSuggestions([]);
      }
    });
  }, [query]);

  const selectSuggestion = useCallback(
    (tip: any) => {
      const loc: Location = {
        name: tip.name,
        lat: tip.location.getLat(),
        lng: tip.location.getLng(),
      };
      onChange(loc);
      setSuggestions([]);
      setQuery(tip.name);
      setShowMap(true);

      if (mapInstance.current) {
        mapInstance.current.setCenter([loc.lng, loc.lat]);
        mapInstance.current.setZoom(15);
        setMarkerAt(loc.lng, loc.lat, mapInstance.current);
      }
    },
    [onChange, setMarkerAt]
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            disabled={disabled}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={handleSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={() => setShowMap(!showMap)}
          type="button"
        >
          <MapPin className="size-4" />
        </Button>
      </div>

      {value && (
        <p className="text-xs text-muted-foreground truncate">
          <MapPin className="inline size-3 mr-1" />
          {value.name}
        </p>
      )}

      {suggestions.length > 0 && (
        <ul className="border rounded-lg bg-popover shadow-md divide-y max-h-48 overflow-auto">
          {suggestions.map((tip, i) => (
            <li key={i}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start rounded-none px-3 py-2 text-left text-sm font-normal"
                onClick={() => selectSuggestion(tip)}
              >
                <span className="font-medium">{tip.name}</span>
                {tip.district && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {tip.district}
                  </span>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {showMap && (
        <div
          ref={mapRef}
          className="w-full h-48 rounded-lg border bg-muted"
        />
      )}
    </div>
  );
}
