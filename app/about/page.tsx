import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Sparkles,
  Users
} from "lucide-react";

const steps = [
  { number: "01", icon: MapPin, title: "Hitta en plats", text: "Upptäck gator, torg, parker och andra miljöer där det finns potential." },
  { number: "02", icon: Lightbulb, title: "Dela en vision", text: "Beskriv vad som kan bli bättre och visa gärna hur platsen skulle kunna se ut." },
  { number: "03", icon: Users, title: "Samla stöd", text: "Rösta, kommentera och bygg vidare på idéer tillsammans med andra." }
];

export default function AboutPage() {
  return (
    <main className="px-5 pb-20 pt-32 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-ink px-7 py-14 text-white shadow-2xl sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#7056d8]/60 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#e255b3]/30 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[#b9a9ff]">OM CITYVISION</p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Staden tillhör alla som bor i den.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              CityVision gör det enkelt att gå från frustration till förslag. Här kan invånare och lokala konstnärer dela idéer om våra gemensamma platser och göra dem synliga, konkreta och möjliga att agera på.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#e8e1ff]">Utforska platser <ArrowRight size={17} /></Link>
              <Link href="/create" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Dela en idé <Sparkles size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="grid gap-10 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-sage">VARFÖR CITYVISION?</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Små förändringar kan göra stor skillnad.</h2>
            <p className="mt-5 leading-relaxed text-slate-500">En otrygg passage, ett tomt torg eller en grå betongvägg påverkar vardagen mer än vi kanske tänker på. CityVision samlar lokalkännedom och kreativitet där den hör hemma: hos människorna som använder platserna – och hos lokala konstnärer som kan ge dem nytt liv.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-mint p-7 dark:bg-[#292044]"><Compass className="mb-8 text-sage" size={25} /><h3 className="text-xl font-semibold">Se potentialen</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">Hitta platser som förtjänar mer liv, trygghet och omtanke.</p></div>
            <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><Heart className="mb-8 text-[#e255b3]" size={25} /><h3 className="text-xl font-semibold">Visa vad som betyder mest</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">Låt röster och stöd göra invånarnas prioriteringar tydliga.</p></div>
            <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><Sparkles className="mb-8 text-[#7056d8]" size={25} /><h3 className="text-xl font-semibold">Ge plats åt skapare</h3><p className="mt-3 text-sm leading-relaxed text-slate-500">Lokala konstnärer kan föreslå färg, ljus, konst och nya uttryck för stadens rum.</p></div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#201b35] sm:p-10">
          <div className="max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-sage">SÅ FUNGERAR DET</p><h2 className="text-3xl font-semibold tracking-tight">Från plats till möjlig förändring.</h2><p className="mt-4 text-slate-500">CityVision är byggt för att göra det lätt att delta, oavsett om du har en färdig idé eller bara ser något som kan bli bättre.</p></div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, text }) => <div key={number} className="relative"><span className="text-sm font-bold text-[#7056d8]">{number}</span><Icon className="mt-7 text-sage" size={23} /><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p></div>)}</div>
        </section>

        <section className="grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#e9e4ff] via-[#f4efff] to-[#dff5ef] p-8 dark:from-[#292044] dark:via-[#241d3e] dark:to-[#183834] sm:p-10">
            <MessageCircle className="text-[#7056d8]" size={28} />
            <h2 className="mt-8 text-3xl font-semibold tracking-tight">En bättre stad börjar med en observation.</h2>
            <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">Du behöver inte vara stadsplanerare. Det räcker att du bryr dig om en plats och vill se den utvecklas.</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Bygg vidare tillsammans.</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-500">
              {["Dela lokala perspektiv", "Låt lokala konstnärer bidra med kreativa förslag", "Gör idéer begripliga med före- och efterbilder", "Skapa tydliga signaler för framtida beslut"].map(item => <li key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-sage dark:bg-[#292044]"><Check size={14} /></span>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] bg-mint px-7 py-12 text-center dark:bg-[#292044] sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">Vilken plats vill du förbättra?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">Börja med att utforska vad andra har sett, eller lägg upp din egen vision.</p>
          <Link href="/explore" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sage">Utforska CityVision <ArrowRight size={17} /></Link>
        </section>
      </div>
    </main>
  );
}
