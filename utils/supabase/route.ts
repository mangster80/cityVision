import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SessionCookie = { name: string; value: string; options: CookieOptions };

export function getSafeRedirectPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") ? value : "/explore";
}

export function createRouteClient(request: NextRequest) {
  const sessionCookies: SessionCookie[] = [];
  const supabase = supabaseUrl && supabaseKey
    ? createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: cookiesToPersist => {
            sessionCookies.push(...cookiesToPersist);
          },
        },
      })
    : null;

  return { supabase, sessionCookies };
}

export function persistSessionCookies(response: NextResponse, sessionCookies: SessionCookie[]) {
  sessionCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
}
