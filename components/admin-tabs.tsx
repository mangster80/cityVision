"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export function AdminTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const tabs = [
    { href: "/admin/users", label: t("admin.users") },
    { href: "/admin/translations", label: t("admin.translations") },
  ];

  return (
    <nav
      aria-label={t("admin.sections")}
      className="mt-4 flex gap-2 overflow-x-auto rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-[#201b35]"
    >
      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-ink text-white"
                : "hover:bg-mint dark:hover:bg-white/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
