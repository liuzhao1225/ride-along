"use client";

import { useCallback, useEffect, useState } from "react";
import type { TripDashboardData } from "../types";
import { getFetchJsonErrorMessage } from "../client/fetch-json";
import { tripClient } from "../client/trip-client";

export function useTripDashboardData(tripId: string) {
  const [data, setData] = useState<TripDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextData = await tripClient.getDashboard(tripId);
      setData(nextData);
      setError(null);
    } catch (nextError) {
      setError(getFetchJsonErrorMessage(nextError, "加载失败"));
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const handleDataUpdated = useCallback(
    (nextData?: TripDashboardData) => {
      if (nextData) {
        setData(nextData);
        setError(null);
        setLoading(false);
        return;
      }
      void refresh();
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    handleDataUpdated,
    setData,
  };
}
