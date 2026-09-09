import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient, getSafeRedirectPath, persistSessionCookies } from "@/utils/supabase/route";

export async function GET(request: NextRequest) {
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
  const loginUrl = new URL("/login", request.url);
  const { supabase, sessionCookies } = createRouteClient(request);
  if (!supabase) {
    loginUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(loginUrl);
  }

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
  persistSessionCookies(response, sessionCookies);
  return response;
}
