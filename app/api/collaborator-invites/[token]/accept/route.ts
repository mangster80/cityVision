import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
  if (!authData.user?.email) return NextResponse.json({ error: "Logga in för att acceptera inbjudan." }, { status: 401 });

  const { data: invite, error: inviteError } = await supabase
    .from("proposal_collaborator_invites")
    .select("id, proposal_id, email, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });
  if (!invite) return NextResponse.json({ error: "Inbjudan hittades inte." }, { status: 404 });
  if (invite.status !== "pending" || new Date(invite.expires_at) <= new Date()) {
    return NextResponse.json({ error: "Inbjudan är inte längre giltig." }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== authData.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Logga in med e-postadressen som fick inbjudan." }, { status: 403 });
  }

  const { error: collaboratorError } = await supabase
    .from("proposal_collaborators")
    .upsert({ proposal_id: invite.proposal_id, user_id: authData.user.id });
  if (collaboratorError) return NextResponse.json({ error: collaboratorError.message }, { status: 500 });

  const { error: updateError } = await supabase
    .from("proposal_collaborator_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ proposalId: invite.proposal_id });
}
