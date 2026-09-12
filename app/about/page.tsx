"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  Clock,
  Radio
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function AboutPage() {
  const { t } = useLanguage();
  const steps = [
    { number: "01", icon: MapPin, title: t("about.step1Title"), text: t("about.step1Text") },
    { number: "02", icon: Lightbulb, title: t("about.step2Title"), text: t("about.step2Text") },
    { number: "03", icon: Radio, title: t("about.step3Title"), text: t("about.step3Text") },
    { number: "04", icon: Clock, title: t("about.step4Title"), text: t("about.step4Text") }
  ];
  return (
    <main className="px-5 pb-20 pt-32 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-ink px-7 py-14 text-white shadow-2xl sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#7056d8]/60 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#e255b3]/30 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#b9a9ff]">{t("about.eyebrow")}</p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">{t("about.title")}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              {t("about.intro")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#e8e1ff] dark:bg-mint dark:text-ink dark:hover:bg-white">{t("about.explore")} <ArrowRight size={17} /></Link>
              <Link href="/create" className="inline-flex items-center gap-2 rounded-full border border-white/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15 dark:border-white/70 dark:hover:bg-white/20">{t("about.share")} <Sparkles size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="grid gap-10 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("about.why")}</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("about.whyTitle")}</h2>
            <p className="mt-5 leading-relaxed text-slate-500">{t("about.whyText")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-mint p-7 dark:bg-[#292044]"><Compass className="mb-8 text-sage" size={25} /><h3 className="text-xl font-semibold">{t("about.potential")}</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">{t("about.potentialText")}</p></div>
            <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><Heart className="mb-8 text-[#e255b3]" size={25} /><h3 className="text-xl font-semibold">{t("about.matters")}</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">{t("about.mattersText")}</p></div>
            <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><Sparkles className="mb-8 text-[#7056d8]" size={25} /><h3 className="text-xl font-semibold">{t("about.creators")}</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">{t("about.creatorsText")}</p></div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35] sm:p-10">
          <div className="max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("about.how")}</p><h2 className="text-3xl font-semibold tracking-tight">{t("about.howTitle")}</h2><p className="mt-4 text-slate-500">{t("about.howText")}</p></div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ number, icon: Icon, title, text }) => <div key={number} className="relative rounded-2xl border border-black/5 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/[0.02]"><span className="text-sm font-bold text-[#7056d8]">{number}</span><Icon className="mt-5 text-sage" size={24} /><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p></div>)}</div>
        </section>

        <section className="grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#e9e4ff] via-[#f4efff] to-[#dff5ef] p-8 dark:from-[#292044] dark:via-[#241d3e] dark:to-[#183834] sm:p-10">
            <MessageCircle className="text-[#7056d8]" size={28} />
            <h2 className="mt-8 text-3xl font-semibold tracking-tight">{t("about.observation")}</h2>
            <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">{t("about.observationText")}</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{t("about.together")}</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-500">
              {["about.localPerspectives", "about.localArtists", "about.beforeAfter", "about.signals"].map(key => <li key={key} className="flex items-center gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-sage dark:bg-[#292044]"><Check size={14} /></span>{t(key)}</li>)}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] bg-mint px-7 py-12 text-center dark:bg-[#292044] sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">{t("about.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">{t("about.ctaText")}</p>
          <Link href="/explore" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sage">{t("about.ctaButton")} <ArrowRight size={17} /></Link>
        </section>
      </div>
    </main>
  );
}
