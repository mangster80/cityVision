import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
          <nav
            aria-label="Adminsektioner"
            className="mt-4 flex gap-2 overflow-x-auto rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-[#201b35]"
          >
            <Link
              href="/admin/translations"
              className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-mint dark:hover:bg-white/10"
            >
              Översättningar
            </Link>
            <Link
              href="/admin/users"
              className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-mint dark:hover:bg-white/10"
            >
              Användare
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}
