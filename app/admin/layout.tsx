import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminTabs } from "@/components/admin-tabs";

const translationAdminId = "fdaade01-5f94-456b-ba84-647069363d45";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");
  if (data.user.id !== translationAdminId) redirect("/explore");

  return (
    <main className="px-5 pb-20 pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-sage">
            ADMIN
          </p>
          <AdminTabs />
        </div>
        {children}
      </div>
    </main>
  );
}
