import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function redirectPath(value: string | null) {
  return value?.startsWith("/") ? value : "/explore";
}

export async function GET(request: NextRequest) {
  const next = redirectPath(request.nextUrl.searchParams.get("next"));
  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", next);
  const code = request.nextUrl.searchParams.get("code");
  if (!supabaseUrl || !supabaseKey || !code) {
    callbackUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(callbackUrl);
  }

  const sessionCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookiesToPersist => {
        sessionCookies.push(...cookiesToPersist);
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) callbackUrl.searchParams.set("error", error.message);

  const response = NextResponse.redirect(callbackUrl);
  sessionCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
