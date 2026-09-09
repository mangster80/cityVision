import { type NextRequest, NextResponse } from "next/server";
import { createRouteClient, getSafeRedirectPath, persistSessionCookies } from "@/utils/supabase/route";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const email = typeof body === "object" && body !== null && "email" in body && typeof body.email === "string" ? body.email.trim() : "";
  const next = getSafeRedirectPath(typeof body === "object" && body !== null && "next" in body ? body.next : null);

  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const { supabase, sessionCookies } = createRouteClient(request);
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 500 });
  const callbackUrl = new URL("/auth/magic-link/callback", request.url);
  callbackUrl.searchParams.set("next", next);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl.toString() },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const response = NextResponse.json({ success: true });
  persistSessionCookies(response, sessionCookies);
  return response;
}
