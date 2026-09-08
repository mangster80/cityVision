import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function redirectPath(value: string | null) {
  return value?.startsWith("/") ? value : "/explore";
}

export async function GET(request: NextRequest) {
  const next = redirectPath(request.nextUrl.searchParams.get("next"));
  const loginUrl = new URL("/login", request.url);
  if (!supabaseUrl || !supabaseKey) {
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
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
  const callbackUrl = new URL("/auth/oauth/callback", request.url);
  callbackUrl.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: callbackUrl.toString(), skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    loginUrl.searchParams.set("error", error?.message ?? "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(data.url);
  sessionCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
