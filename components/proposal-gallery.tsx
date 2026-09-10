"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function ProposalGallery({ images, label, accent = false }: { images: string[]; label: string; accent?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const { t } = useLanguage();
  const index = selected ?? 0;
  const hasMultiple = images.length > 1;
  const close = () => setSelected(null);
  useEffect(() => {
    if (selected === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") setSelected(current => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setSelected(current => current === null ? null : (current + 1) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, selected]);
  return <>
    <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${accent ? "text-sage" : "text-slate-400"}`}>{label}</p>
    <button type="button" aria-label={`${t("gallery.open")} ${label.toLocaleLowerCase("sv-SE")}bilder`} onClick={() => setSelected(0)} className="group relative block h-[380px] w-full cursor-zoom-in overflow-hidden rounded-3xl text-left">
      <Image sizes="(max-width: 1024px) 50vw, 30vw" src={images[0]} alt={label} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent px-4 pb-4 pt-10 text-left text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">{hasMultiple ? `${t("gallery.show-all")} ${images.length} ${t("gallery.images")}` : t("gallery.open-image")}</span>
      {hasMultiple && <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">{images.length} {t("gallery.images")}</span>}
    </button>
    {selected !== null && <div role="dialog" aria-modal="true" aria-label={`${label}, bild ${index + 1} av ${images.length}`} className="fixed inset-0 z-[60] grid place-items-center bg-ink/85 p-5 backdrop-blur-sm" onClick={close}>
      <div className="relative h-[min(78vh,720px)] w-full max-w-5xl" onClick={event => event.stopPropagation()}>
        <Image sizes="100vw" src={images[index]} alt={`${label}, bild ${index + 1}`} fill className="object-contain" />
        <button type="button" aria-label="Stäng bildvisning" onClick={close} className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={20} /></button>
        {hasMultiple && <><button type="button" aria-label="Föregående bild" onClick={() => setSelected((index - 1 + images.length) % images.length)} className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronLeft size={22} /></button><button type="button" aria-label="Nästa bild" onClick={() => setSelected((index + 1) % images.length)} className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronRight size={22} /></button><span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">{index + 1} / {images.length}</span></>}
      </div>
    </div>}
  </>;
}
