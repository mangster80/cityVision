import { createClient } from "@/utils/supabase/server";

type Profile = {
  id: string;
  name: string;
  auth_email: string | null;
  provider_email: string | null;
  provider: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
};

const onlineThresholdMs = 2 * 60 * 1000;

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("sv-SE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Aldrig";
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const currentTime = new Date().getTime();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, auth_email, provider_email, provider, role, created_at, last_sign_in_at, last_seen_at")
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
            <tr>
              <th className="px-5 py-4">Namn</th>
              <th className="px-5 py-4">E-post</th>
              <th className="px-5 py-4">Inloggning</th>
              <th className="px-5 py-4">Roll</th>
              <th className="px-5 py-4">Registrerad</th>
              <th className="px-5 py-4">Senaste inloggning</th>
              <th className="px-5 py-4">Status</th>
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
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {formatDate(profile.last_sign_in_at)}
                </td>
                <td className="px-5 py-4">
                  {profile.last_seen_at &&
                  currentTime - new Date(profile.last_seen_at).getTime() <=
                    onlineThresholdMs ? (
                    <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <span
                        aria-label="Online"
                        className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                      />
                      Online
                    </span>
                  ) : (
                    <span className="text-slate-500">Offline</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
