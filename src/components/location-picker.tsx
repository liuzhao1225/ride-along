"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAMap } from "./amap-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";

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
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "搜索地点...",
  center,
}: LocationPickerProps) {
  const { loaded, AMap, loadError } = useAMap();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const autoCompleteRef = useRef<any>(null);

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
      markerRef.current = new AMap.Marker({
        position: [value.lng, value.lat],
        map,
      });
    }

    map.on("click", (e: any) => {
      const lnglat = e.lnglat;
      if (markerRef.current) {
        markerRef.current.setPosition(lnglat);
      } else {
        markerRef.current = new AMap.Marker({
          position: lnglat,
          map,
        });
      }
      const geocoder = new AMap.Geocoder();
      geocoder.getAddress(lnglat, (status: string, result: any) => {
        const name =
          status === "complete"
            ? result.regeocode?.formattedAddress || "选中位置"
            : "选中位置";
        onChange({ name, lat: lnglat.getLat(), lng: lnglat.getLng() });
      });
    });
  }, [AMap, center, value, onChange]);

  useEffect(() => {
    if (loaded && showMap) {
      setTimeout(initMap, 100);
    }
  }, [loaded, showMap, initMap]);

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
        if (markerRef.current) {
          markerRef.current.setPosition([loc.lng, loc.lat]);
        } else if (AMap) {
          markerRef.current = new AMap.Marker({
            position: [loc.lng, loc.lat],
            map: mapInstance.current,
          });
        }
      }
    },
    [onChange, AMap]
  );

  if (loaded && !AMap) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {loadError ?? "地图未就绪，无法搜索地点。请配置 NEXT_PUBLIC_AMAP_KEY 后重新部署。"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
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
            disabled={!loaded}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
        </div>
        <Button
          variant="outline"
          size="icon"
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
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => selectSuggestion(tip)}
              >
                <span className="font-medium">{tip.name}</span>
                {tip.district && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {tip.district}
                  </span>
                )}
              </button>
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
