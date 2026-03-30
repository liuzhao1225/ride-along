"use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";

interface Session {
  userId: string;
  nickname: string;
}

const STORAGE_KEY = "ride-along-session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          setSession(JSON.parse(raw));
        } catch {
          // corrupted, ignore
        }
      }
    } catch {
      // private mode / disabled storage / sandbox — still show app
    }
    setLoaded(true);
  }, []);

  const saveSession = useCallback((nickname: string) => {
    let userId: string;
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        try {
          userId = JSON.parse(existing).userId;
        } catch {
          userId = nanoid(10);
        }
      } else {
        userId = nanoid(10);
      }
      const s: Session = { userId, nickname };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      setSession(s);
      return s;
    } catch {
      const s: Session = { userId: nanoid(10), nickname };
      setSession(s);
      return s;
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
  }, []);

  return { session, loaded, saveSession, clearSession };
}
