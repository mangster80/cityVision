import { createClient } from "@/utils/supabase/server";
import { AdminUsersTable } from "@/components/admin-users-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, auth_email, provider_email, provider, role, created_at, last_sign_in_at, last_seen_at")
    .order("created_at", { ascending: false });

  return (
    <section>
      <AdminUsersTable profiles={profiles ?? []} hasError={Boolean(error)} />
    </section>
  );
}
