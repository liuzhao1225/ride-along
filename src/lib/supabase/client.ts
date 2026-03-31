"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function createFallbackBrowserClient() {
  const notConfigured = new Error("Supabase env is not configured");

  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: notConfigured };
      },
      async signUp() {
        return { data: { user: null, session: null }, error: notConfigured };
      },
      async signOut() {
        return { error: null };
      },
    },
  } as unknown as SupabaseClient<Database>;
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return createFallbackBrowserClient();
  }
  return createBrowserClient<Database>(
    url,
    anonKey
  );
}
