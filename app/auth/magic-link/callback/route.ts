import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient, getSafeRedirectPath, persistSessionCookies } from "@/utils/supabase/route";

export async function GET(request: NextRequest) {
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", next);
  const code = request.nextUrl.searchParams.get("code");
  const { supabase, sessionCookies } = createRouteClient(request);
  if (!supabase || !code) {
    callbackUrl.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(callbackUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) callbackUrl.searchParams.set("error", error.message);

  const response = NextResponse.redirect(callbackUrl);
  persistSessionCookies(response, sessionCookies);
  return response;
}
