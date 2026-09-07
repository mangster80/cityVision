"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Coins, ImagePlus, LocateFixed, MapPin, Sparkles, UserRound } from "lucide-react";
import { getStoredUser } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";
import { LocationSuggestion, searchLocations, searchMunicipalities } from "@/services/geocoding-service";
import { useUnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import { createSupabaseProposal } from "@/services/proposal-service";

interface Draft {
  placeName: string;
  municipality: string;
  title: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  problem: string;
  idea: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
}

const draftStorageKey = "cityvision-draft";
const categoryTranslations: Record<string, string> = { Broar: "Bridges", Torg: "Squares", Park: "Parks", Kollektivtrafik: "Public transport", Infrastruktur: "Infrastructure", Promenad: "Promenade", Lekplats: "Playground", Plats: "Public space" };
export default function CreatePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [municipalityQuery, setMunicipalityQuery] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<LocationSuggestion[]>([]);
  const skipMunicipalitySearch = useRef(false);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { dialog } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    const syncSession = async () => {
      if (!supabase) {
        setLoggedIn(Boolean(getStoredUser()));
        return;
      }
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
    };
    void syncSession();
    window.addEventListener("cityvision-auth-change", syncSession);
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => { void syncSession(); }) ?? { data: { subscription: null } };
    return () => {
      window.removeEventListener("cityvision-auth-change", syncSession);
      authListener.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void searchLocations(locationQuery, controller.signal)
        .then(setLocationSuggestions)
        .catch(error => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setLocationSearchError(true);
        });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [locationQuery]);

  useEffect(() => {
    if (skipMunicipalitySearch.current) {
      skipMunicipalitySearch.current = false;
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void searchMunicipalities(municipalityQuery, controller.signal)
        .then(setMunicipalitySuggestions)
        .catch(error => {
          if (!(error instanceof DOMException && error.name === "AbortError")) setMunicipalitySuggestions([]);
        });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [municipalityQuery]);

  const selectLocation = (suggestion: LocationSuggestion) => {
    setLocationQuery(suggestion.displayName);
    setLocationSuggestions([]);
    setLocationSearchError(false);
    setIsDirty(true);
    const locationInput = document.getElementById("location");
    if (locationInput instanceof HTMLInputElement) locationInput.value = suggestion.displayName;
    const municipalityInput = document.getElementById("municipality");
    if (municipalityInput instanceof HTMLInputElement && suggestion.municipality) municipalityInput.value = suggestion.municipality;
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    if (latitudeInput instanceof HTMLInputElement) latitudeInput.value = String(suggestion.latitude);
    if (longitudeInput instanceof HTMLInputElement) longitudeInput.value = String(suggestion.longitude);
  };
  const selectMunicipality = (suggestion: LocationSuggestion) => {
    skipMunicipalitySearch.current = true;
    setMunicipalityQuery(suggestion.municipality || suggestion.displayName);
    setMunicipalitySuggestions([]);
    setIsDirty(true);
  };

  const handleImages = (event: ChangeEvent<HTMLInputElement>, setImages: (values: string[]) => void) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (files.some(file => !file.type.startsWith("image/"))) {
      setImageError(t("Välj bilder i JPG-, PNG- eller WEBP-format.", "Choose JPG, PNG, or WEBP images."));
      return;
    }
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      setImageError(t("Varje bild får vara högst 10 MB.", "Each image must be no larger than 10 MB."));
      return;
    }
    setImageError("");
    setIsDirty(true);
    Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
      reader.readAsDataURL(file);
    }))).then(setImages).catch(() => setImageError(t("Bilderna kunde inte läsas in.", "The images could not be loaded.")));
  };
  const removeImage = (images: string[], index: number, setImages: (values: string[]) => void) => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index));
    setIsDirty(true);
  };
  useEffect(() => {
    if (!restoreDraft || !formRef.current) return;
    const form = formRef.current;
    (["title", "placeName", "municipality", "category", "location", "problem", "idea", "cost"] as const).forEach(name => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        field.value = restoreDraft[name];
      }
    });
    setMunicipalityQuery(restoreDraft.municipality);
    setLocationQuery(restoreDraft.location);
    setBeforeImages(restoreDraft.beforeImages);
    setAfterImages(restoreDraft.afterImages);
    setIsDirty(true);
    setRestoreDraft(null);
  }, [restoreDraft]);
  useEffect(() => {
    const imageLabels = Array.from(document.querySelectorAll<HTMLLabelElement>("label")).filter(label => label.querySelector('input[type="file"]'));
    imageLabels.forEach((label, labelIndex) => {
      const images = labelIndex === 0 ? beforeImages : afterImages;
      const setImages = labelIndex === 0 ? setBeforeImages : setAfterImages;
      const existing = label.querySelector("[data-image-removal-controls]");
      existing?.remove();
      if (!images.length) return;
      const imageGrid = label.querySelector("div.grid");
      if (!imageGrid) return;
      Array.from(imageGrid.querySelectorAll("img")).forEach((image, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "relative";
        image.replaceWith(wrapper);
        wrapper.appendChild(image);
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-lg leading-none text-white shadow-md transition hover:bg-red-600";
        removeButton.setAttribute("aria-label", `${t("Ta bort bild", "Remove image")} ${index + 1}`);
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => removeImage(images, index, setImages));
        wrapper.appendChild(removeButton);
      });
    });
    return () => document.querySelectorAll("[data-image-removal-controls]").forEach(control => control.remove());
  }, [beforeImages, afterImages, t]);

  const handleUseCurrentLocation = () => {
    setIsDirty(true);
    if (!navigator.geolocation) {
      setLocationStatus(t("Din webbläsare stöder inte platsåtkomst.", "Your browser does not support location access."));
      return;
    }
    setLocationStatus(t("Hämtar position...", "Getting location..."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationStatus(`${t("Position vald:", "Location selected:")} ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        const locationInput = document.getElementById("location");
        if (locationInput instanceof HTMLInputElement) {
          locationInput.value = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
          setLocationQuery(locationInput.value);
        }
        const latitudeInput = document.getElementById("latitude");
        const longitudeInput = document.getElementById("longitude");
        if (latitudeInput instanceof HTMLInputElement) latitudeInput.value = String(coords.latitude);
        if (longitudeInput instanceof HTMLInputElement) longitudeInput.value = String(coords.longitude);
      },
      () => setLocationStatus(t("Kunde inte hämta positionen. Kontrollera platsåtkomst.", "Could not get your location. Check location permissions."))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    if (!beforeImages.length || !afterImages.length) {
      setImageError(t("Ladda upp minst en före-bild och en efter-bild.", "Upload at least one before image and one after image."));
      return;
    }
    const form = new FormData(event.currentTarget);
    const nextDraft: Draft = {
      placeName: String(form.get("placeName") || ""),
      municipality: String(form.get("municipality") || ""),
      title: String(form.get("title") || ""),
      category: String(form.get("category") || ""),
      location: String(form.get("location") || ""),
      latitude: Number(form.get("latitude") || 0) || undefined,
      longitude: Number(form.get("longitude") || 0) || undefined,
      problem: String(form.get("problem") || ""),
      idea: String(form.get("idea") || ""),
      cost: String(form.get("cost") || ""),
      beforeImages,
      afterImages
    };
    setIsSaving(true);
    try {
      await createSupabaseProposal(nextDraft);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("Förslaget kunde inte sparas.", "The proposal could not be saved."));
      setIsSaving(false);
      return;
    }
    localStorage.setItem(draftStorageKey, JSON.stringify(nextDraft));
    setIsDirty(false);
    setDraft(nextDraft);
    setIsSaving(false);
  };

  if (loggedIn === null) {
    return <main className="grid min-h-screen place-items-center px-5 pt-20"><p className="text-sm text-slate-500">Laddar...</p></main>;
  }

  if (!loggedIn) {
    return <main className="grid min-h-screen place-items-center px-5 pt-20"><div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#201b35] sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-sage"><UserRound size={24}/></div><h1 className="mt-6 text-3xl font-semibold">Logga in för att skapa</h1><p className="mt-3 text-slate-500">Du behöver vara inloggad för att dela en plats eller förbättringsidé.</p><div className="mt-8 flex justify-center gap-3"><Link href="/explore" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/15 dark:bg-[#201b35]">Till utforska</Link><Link href="/login?redirect=%2Fcreate" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Logga in</Link></div></div></main>;
  }

  if (draft) {
    return <main className="grid min-h-screen place-items-center px-5 pt-20"><div className="w-full max-w-lg text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-sage"><Check size={28}/></div><h1 className="mt-6 text-3xl font-semibold">Din vision är sparad!</h1><p className="mx-auto mt-3 max-w-md text-slate-500">Det här är ett lokalt mockutkast. När backend kopplas på kan du publicera det för hela staden.</p><div className="mt-8 rounded-3xl border border-black/5 bg-white p-5 text-left shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-sage">UTKAST</p><h2 className="mt-2 text-xl font-semibold">{draft.title}</h2><p className="mt-1 text-sm text-slate-500">{draft.placeName}</p>    <p className="mt-1 text-sm font-medium text-sage">{draft.municipality} · {t(draft.category, categoryTranslations[draft.category] || draft.category)}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-400"><MapPin size={14}/> {draft.location}</p>        <p className="mt-4 text-sm leading-relaxed text-slate-500">{draft.idea}</p>{(draft.beforeImages.length || draft.afterImages.length) > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{[...draft.beforeImages, ...draft.afterImages].map((image, index) => <Image key={`${image.slice(0, 16)}-${index}`} unoptimized src={image} alt={index < draft.beforeImages.length ? `Före-bild ${index + 1}` : `Efter-bild ${index - draft.beforeImages.length + 1}`} width={240} height={160} className="h-28 w-full rounded-xl object-cover"/>)}</div>}{draft.cost && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink"><Coins size={16} className="text-sage"/> Budget: {new Intl.NumberFormat("sv-SE").format(Number(draft.cost))} kr</p>}</div><div className="mt-7 flex justify-center gap-3"><Link href="/explore" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">Till utforska</Link>        <button onClick={() => { setRestoreDraft(draft); setDraft(null); }} className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold">{t("Fortsätt redigera", "Continue editing")}</button></div></div></main>;
  }

   return <main className="px-5 pb-20 pt-32 sm:px-10"><div className="mx-auto max-w-3xl"><Link href="/explore" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> Avbryt</Link><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">DIN TUR ATT PÅVERKA</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Dela en vision</h1><p className="mt-4 text-lg text-slate-500">Berätta om platsen du vill se förändrad och hur du tänker.</p>            <form ref={formRef} onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="mt-10 space-y-7"><div><label htmlFor="title" className="mb-2 block text-sm font-semibold">Förslagets titel</label><input id="title" name="title" required minLength={3} placeholder="Till exempel: Varm belysning och mörkgrön färg" className="field"/></div><div><label htmlFor="placeName" className="mb-2 block text-sm font-semibold">Vad heter platsen?</label><input id="placeName" name="placeName" required minLength={3} placeholder="Till exempel: Betongbron vid centrum" className="field"/></div>   <div><label htmlFor="municipality" className="mb-2 block text-sm font-semibold">Kommun</label>      <div className="relative"><input id="municipality" name="municipality" autoComplete="address-level2" required minLength={2} value={municipalityQuery} onChange={event => { setMunicipalityQuery(event.target.value); setMunicipalitySuggestions([]); setIsDirty(true); }} placeholder="Till exempel: Nacka kommun" className="field"/>{municipalitySuggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">{municipalitySuggestions.map(suggestion => <button key={`${suggestion.latitude}-${suggestion.longitude}`} type="button" onClick={() => selectMunicipality(suggestion)} className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10">{suggestion.municipality || suggestion.displayName}</button>)}</div>}   </div></div><div>   <label htmlFor="category" className="mb-2 block text-sm font-semibold">{t("Kategori för förslaget", "Proposal category")}</label><select id="category" name="category" required defaultValue="" className="field"><option value="" disabled>{t("Välj kategori", "Choose a category")}</option><option value="Broar">{t("Broar", "Bridges")}</option><option value="Torg">{t("Torg", "Squares")}</option><option value="Park">{t("Park", "Parks")}</option><option value="Kollektivtrafik">{t("Kollektivtrafik", "Public transport")}</option><option value="Infrastruktur">{t("Infrastruktur", "Infrastructure")}</option><option value="Promenad">{t("Promenad", "Promenade")}</option><option value="Lekplats">{t("Lekplats", "Playground")}</option><option value="Plats">{t("Plats", "Public space")}</option></select></div><div><label htmlFor="location" className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin size={16} className="text-sage"/> Var ligger den?</label><div className="flex gap-2"><div className="relative flex-1">   <input id="location" name="location" required minLength={2} value={locationQuery} onChange={event => { setLocationQuery(event.target.value); setIsDirty(true); setLocationSearchError(false); }} placeholder="Sök adress eller område" className="field"/>{locationSuggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">{locationSuggestions.map(suggestion => <button key={`${suggestion.latitude}-${suggestion.longitude}`} type="button" onClick={() => selectLocation(suggestion)} className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10">{suggestion.displayName}</button>)}</div>}{locationSearchError && <p className="mt-2 text-xs text-slate-500">{t("Platsförslag kunde inte hämtas just nu.", "Location suggestions are unavailable right now.")}</p>}<input id="latitude" name="latitude" type="hidden"/><input id="longitude" name="longitude" type="hidden"/></div><button type="button" onClick={handleUseCurrentLocation} className="flex shrink-0 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold dark:border-white/15 dark:bg-[#201b35]"><LocateFixed size={16} className="shrink-0 text-sage"/> Min position</button></div>{locationStatus && <p className="mt-2 text-xs text-slate-500">{locationStatus}</p>}</div>      <div className="space-y-5"><div><p className="mb-2 text-sm font-semibold">1. Bilder på platsen idag     </p><label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-3 text-center transition hover:bg-mint">{beforeImages.length ? <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">{beforeImages.map((image, index) => <Image key={`${image.slice(0, 16)}-${index}`} unoptimized src={image} alt={`Före-bild ${index + 1}`} width={240} height={160} className="h-28 w-full rounded-xl object-cover"/> )}</div> : <><ImagePlus className="mb-2 text-sage"/><span className="text-sm font-semibold">Ladda upp före-bilder</span><span className="mt-1 text-xs text-slate-400">Välj en eller flera bilder</span></>}<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => handleImages(event, setBeforeImages)} className="hidden"/></label>   </div>{beforeImages.length > 0 && <div className="step-reveal"><p className="mb-2 text-sm font-semibold">2. Bilder på ditt förbättringsförslag</p><label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-3 text-center transition hover:bg-mint">{afterImages.length ? <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">{afterImages.map((image, index) => <Image key={`${image.slice(0, 16)}-${index}`} unoptimized src={image} alt={`Efter-bild ${index + 1}`} width={240} height={160} className="h-28 w-full rounded-xl object-cover"/> )}</div> : <><ImagePlus className="mb-2 text-sage"/><span className="text-sm font-semibold">Ladda upp efter-bilder</span><span className="mt-1 text-xs text-slate-400">Visa din förbättringsvision</span></>}<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event => handleImages(event, setAfterImages)} className="hidden"/></label></div>}{imageError && <p className="text-xs font-medium text-red-600">{imageError}</p>}</div><div><label htmlFor="problem" className="mb-2 block text-sm font-semibold">Vad vill du förbättra?</label><textarea id="problem" name="problem" required minLength={10} rows={4} placeholder="Beskriv vad som inte fungerar idag..." className="field resize-none"/></div><div><label htmlFor="idea" className="mb-2 block text-sm font-semibold">Din förbättringsidé</label><textarea id="idea" name="idea" required minLength={10} rows={4} placeholder="Hur skulle platsen kunna bli bättre?" className="field resize-none"/></div><div><label htmlFor="cost" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Coins size={16} className="text-sage"/> Uppskattad kostnad <span className="font-normal text-slate-400">(valfritt)</span></label><div className="relative"><input id="cost" name="cost" type="number" min="0" step="1000" placeholder="450 000" className="field pr-14"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">kr</span></div></div>   {submitError && <p role="alert" className="text-sm font-medium text-red-600">{submitError}</p>}<button type="submit" disabled={isSaving} className="w-full rounded-full bg-ink py-4 text-sm font-semibold text-white transition hover:bg-sage disabled:cursor-wait disabled:opacity-70"><Sparkles size={17} className="mr-2 inline"/> {isSaving ? "Sparar..." : "Spara förslag"}</button>   </form></div>{pendingNavigation && <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 px-5 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#201b35]"><h2 className="text-xl font-semibold">{t("Lämna sidan?", "Leave this page?")}</h2><p className="mt-2 text-sm text-slate-500">{t("Du har osparade ändringar. Vill du lämna sidan?", "You have unsaved changes. Do you want to leave this page?")}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPendingNavigation(null)} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/15">{t("Nej, stanna kvar", "No, stay")}</button><button type="button" onClick={() => { setIsDirty(false); router.push(pendingNavigation); }} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">{t("Ja, lämna", "Yes, leave")}</button></div>   </div></div>}{dialog}</main>;
}
