"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AMapContextValue {
  /** SDK finished loading (success or failure); UI should not spin forever */
  loaded: boolean;
  AMap: typeof window.AMap | null;
  /** Set when key missing or script failed to load */
  loadError: string | null;
}

const AMapContext = createContext<AMapContextValue>({
  loaded: false,
  AMap: null,
  loadError: null,
});

export function useAMap() {
  return useContext(AMapContext);
}

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

export function AMapProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (window.AMap) {
      setLoaded(true);
      setLoadError(null);
      return;
    }

    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (securityCode) {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    const key = process.env.NEXT_PUBLIC_AMAP_KEY?.trim();
    if (!key) {
      console.error("NEXT_PUBLIC_AMAP_KEY is not set");
      setLoadError("未配置高德地图 Key（NEXT_PUBLIC_AMAP_KEY）");
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Driving,AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder`;
    script.async = true;
    script.onload = () => {
      setLoadError(null);
      setLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load AMap SDK");
      setLoadError("高德地图脚本加载失败，请检查网络或 Key 配置");
      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // don't remove, it stays loaded
    };
  }, []);

  const AMap = loaded && window.AMap ? window.AMap : null;

  return (
    <AMapContext.Provider value={{ loaded, AMap, loadError }}>
      {children}
    </AMapContext.Provider>
  );
}
