import Link from "next/link";

export default function AdminPage() {
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Admin</h1>
        <p className="mt-2 text-slate-500">
          Välj vilken del av administrationen du vill öppna.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/users"
          className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#201b35]"
        >
          <h2 className="text-xl font-semibold">Användare</h2>
          <p className="mt-2 text-sm text-slate-500">
            Visa registrerade användare och deras kontouppgifter.
          </p>
        </Link>
        <Link
          href="/admin/translations"
          className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#201b35]"
        >
          <h2 className="text-xl font-semibold">Översättningar</h2>
          <p className="mt-2 text-sm text-slate-500">
            Redigera svenska och engelska texter i databasen.
          </p>
        </Link>
      </div>
    </section>
  );
}
