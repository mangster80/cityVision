import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomBytes } from "node:crypto";

interface InviteBody {
  email?: unknown;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as InviteBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ange en giltig e-postadress." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
  if (!authData.user) return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id, title, author_id")
    .eq("id", id)
    .maybeSingle();
  if (proposalError) return NextResponse.json({ error: proposalError.message }, { status: 500 });
  if (!proposal) return NextResponse.json({ error: "Förslaget hittades inte." }, { status: 404 });
  if (proposal.author_id !== authData.user.id) return NextResponse.json({ error: "Endast författaren kan bjuda in samarbetspartner." }, { status: 403 });

  const token = randomBytes(32).toString("hex");
  const { error: inviteError } = await supabase.from("proposal_collaborator_invites").insert({
    proposal_id: id,
    inviter_id: authData.user.id,
    email,
    token,
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const inviteUrl = `${siteUrl}/collaborator-invite/${token}`;
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Stadslyft <onboarding@resend.dev>",
      to: [email],
      subject: `Du är inbjuden att samarbeta på ${proposal.title}`,
      html: `<p>Du har blivit inbjuden att samarbeta på förslaget <strong>${proposal.title}</strong>.</p><p><a href="${inviteUrl}">Acceptera inbjudan</a></p>`,
    }),
  });
  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    await supabase.from("proposal_collaborator_invites").delete().eq("token", token);
    return NextResponse.json({ error: `E-post kunde inte skickas: ${detail}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
