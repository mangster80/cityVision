import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function redirectPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") ? value : "/explore";
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const email = typeof body === "object" && body !== null && "email" in body && typeof body.email === "string" ? body.email.trim() : "";
  const next = redirectPath(typeof body === "object" && body !== null && "next" in body ? body.next : null);

  if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 500 });

  const sessionCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookiesToPersist => {
        sessionCookies.push(...cookiesToPersist);
      },
    },
  });
  const callbackUrl = new URL("/auth/magic-link/callback", request.url);
  callbackUrl.searchParams.set("next", next);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl.toString() },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const response = NextResponse.json({ success: true });
  sessionCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
