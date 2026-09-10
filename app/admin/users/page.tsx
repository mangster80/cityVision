import { createClient } from "@/utils/supabase/server";

type Profile = {
  id: string;
  name: string;
  auth_email: string | null;
  provider_email: string | null;
  provider: string | null;
  role: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, auth_email, provider_email, provider, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section>
        <h1 className="text-4xl font-semibold">Användare</h1>
        <p className="mt-4 text-red-600">Användarna kunde inte hämtas.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Användare</h1>
        <p className="mt-2 text-slate-500">{profiles?.length ?? 0} registrerade användare</p>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-[#201b35]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
            <tr>
              <th className="px-5 py-4">Namn</th>
              <th className="px-5 py-4">E-post</th>
              <th className="px-5 py-4">Inloggning</th>
              <th className="px-5 py-4">Roll</th>
              <th className="px-5 py-4">Registrerad</th>
            </tr>
          </thead>
          <tbody>
            {(profiles as Profile[] | null)?.map(profile => (
              <tr key={profile.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                <td className="px-5 py-4 font-semibold">{profile.name}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {profile.auth_email ?? profile.provider_email ?? "—"}
                </td>
                <td className="px-5 py-4">{profile.provider ?? "email"}</td>
                <td className="px-5 py-4">{profile.role ?? "—"}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {new Date(profile.created_at).toLocaleDateString("sv-SE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
