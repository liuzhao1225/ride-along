/* eslint-disable @typescript-eslint/no-explicit-any -- AMap SDK has no official types */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AMapContextValue {
  loaded: boolean;
  AMap: typeof window.AMap | null;
}

const AMapContext = createContext<AMapContextValue>({
  loaded: false,
  AMap: null,
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

  useEffect(() => {
    if (window.AMap) {
      queueMicrotask(() => setLoaded(true));
      return;
    }

    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;
    if (securityCode) {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    const key = process.env.NEXT_PUBLIC_AMAP_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_AMAP_KEY is not set");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Driving,AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error("Failed to load AMap SDK");
    document.head.appendChild(script);

    return () => {
      // don't remove, it stays loaded
    };
  }, []);

  return (
    <AMapContext.Provider value={{ loaded, AMap: loaded ? window.AMap : null }}>
      {children}
    </AMapContext.Provider>
  );
}
