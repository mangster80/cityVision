"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Coins,
  ImagePlus,
  LocateFixed,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getStoredUser, isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";
import {
  LocationSuggestion,
  searchLocations,
  searchMunicipalities,
} from "@/services/geocoding-service";
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
const maxDraftStorageBytes = 1_500_000;
const categoryTranslations: Record<string, string> = {
  Broar: "Bridges",
  Torg: "Squares",
  Park: "Parks",
  Kollektivtrafik: "Public transport",
  Infrastruktur: "Infrastructure",
  Promenad: "Promenade",
  Lekplats: "Playground",
  Plats: "Public space",
};
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
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [municipalityQuery, setMunicipalityQuery] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const skipMunicipalitySearch = useRef(false);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { dialog } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    let syncRequest = 0;
    const syncSession = async () => {
      const requestId = ++syncRequest;
      const storedUser = getStoredUser();
      if (!supabase && (storedUser || isDemoLoginEnabled())) {
        setLoggedIn(true);
        return;
      }
      if (!supabase) {
        if (requestId === syncRequest) setLoggedIn(false);
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (requestId !== syncRequest) return;
      if (error || !data.user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(
        Boolean(data.user),
      );
    };
    void syncSession();
    window.addEventListener("cityvision-auth-change", syncSession);
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => {
      void syncSession();
    }) ?? { data: { subscription: null } };
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
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
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
        .catch((error) => {
          if (!(error instanceof DOMException && error.name === "AbortError"))
            setMunicipalitySuggestions([]);
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
    if (locationInput instanceof HTMLInputElement)
      locationInput.value = suggestion.displayName;
    const municipalityInput = document.getElementById("municipality");
    if (
      municipalityInput instanceof HTMLInputElement &&
      suggestion.municipality
    )
      municipalityInput.value = suggestion.municipality;
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    if (latitudeInput instanceof HTMLInputElement)
      latitudeInput.value = String(suggestion.latitude);
    if (longitudeInput instanceof HTMLInputElement)
      longitudeInput.value = String(suggestion.longitude);
  };
  const selectMunicipality = (suggestion: LocationSuggestion) => {
    skipMunicipalitySearch.current = true;
    setMunicipalityQuery(suggestion.municipality || suggestion.displayName);
    setMunicipalitySuggestions([]);
    setIsDirty(true);
  };

  const handleImages = (
    event: ChangeEvent<HTMLInputElement>,
    setImages: (values: string[]) => void,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setImageError(t("create.choose-jpg-png-or-webp-images"));
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setImageError(t("create.each-image-must-be-no-larger-than-10-mb"));
      return;
    }
    setImageError("");
    setIsDirty(true);
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("Invalid image"));
            reader.onerror = () =>
              reject(reader.error ?? new Error("Could not read image"));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then(setImages)
      .catch(() => setImageError(t("create.the-images-could-not-be-loaded")));
  };
  const removeImage = (
    images: string[],
    index: number,
    setImages: (values: string[]) => void,
  ) => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index));
    setIsDirty(true);
  };
  useEffect(() => {
    if (!restoreDraft || !formRef.current) return;
    const form = formRef.current;
    (
      [
        "title",
        "placeName",
        "municipality",
        "category",
        "location",
        "problem",
        "idea",
        "cost",
      ] as const
    ).forEach((name) => {
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) {
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
    const imageLabels = Array.from(
      document.querySelectorAll<HTMLLabelElement>("label"),
    ).filter((label) => label.querySelector('input[type="file"]'));
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
        removeButton.className =
          "absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-lg leading-none text-white shadow-md transition hover:bg-red-600";
        removeButton.setAttribute(
          "aria-label",
          `${t("create.remove-image")} ${index + 1}`,
        );
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () =>
          removeImage(images, index, setImages),
        );
        wrapper.appendChild(removeButton);
      });
    });
    return () =>
      document
        .querySelectorAll("[data-image-removal-controls]")
        .forEach((control) => control.remove());
  }, [beforeImages, afterImages, t]);

  const handleUseCurrentLocation = () => {
    setIsDirty(true);
    if (!navigator.geolocation) {
      setLocationStatus(
        t("create.your-browser-does-not-support-location-access"),
      );
      return;
    }
    setLocationStatus(t("create.getting-location"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationStatus(
          `${t("create.location-selected")} ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        );
        const locationInput = document.getElementById("location");
        if (locationInput instanceof HTMLInputElement) {
          locationInput.value = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
          setLocationQuery(locationInput.value);
        }
        const latitudeInput = document.getElementById("latitude");
        const longitudeInput = document.getElementById("longitude");
        if (latitudeInput instanceof HTMLInputElement)
          latitudeInput.value = String(coords.latitude);
        if (longitudeInput instanceof HTMLInputElement)
          longitudeInput.value = String(coords.longitude);
      },
      () =>
        setLocationStatus(
          t("create.could-not-get-your-location-check-location-permissions"),
        ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    if (!beforeImages.length || !afterImages.length) {
      setImageError(
        t("create.upload-at-least-one-before-image-and-one-after-image"),
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    const nextDraft: Draft = {
      placeName: String(form.get("placename") || ""),
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
      afterImages,
    };
    setIsSaving(true);
    try {
      await createSupabaseProposal(nextDraft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isExistingResource = /resource already exists|already exists/i.test(message);
      setSubmitError(
        message === "AUTH_SESSION_EXPIRED"
          ? t("create.session-expired")
          : message === "PROPOSAL_IMAGE_BUCKET_MISSING"
            ? t("create.image-storage-unavailable")
            : message === "PROPOSAL_IMAGE_ALREADY_EXISTS"
              ? t("create.image-upload-already-exists")
          : isExistingResource
          ? t("create.image-upload-already-exists")
          : message && /storage|upload|image/i.test(message)
            ? t("create.images-could-not-be-uploaded")
            : t("create.the-proposal-could-not-be-saved"),
      );
      if (message === "AUTH_SESSION_EXPIRED") setLoggedIn(false);
      setIsSaving(false);
      return;
    }
    try {
      const serializedDraft = JSON.stringify(nextDraft);
      if (serializedDraft.length <= maxDraftStorageBytes) {
        localStorage.setItem(draftStorageKey, serializedDraft);
      } else {
        localStorage.removeItem(draftStorageKey);
      }
    } catch (storageError) {
      if (
        storageError instanceof DOMException &&
        (storageError.name === "QuotaExceededError" ||
          storageError.code === DOMException.QUOTA_EXCEEDED_ERR)
      ) {
        localStorage.removeItem(draftStorageKey);
      } else {
        throw storageError;
      }
    }
    setIsDirty(false);
    setDraft(nextDraft);
    setIsSaving(false);
  };

  if (loggedIn === null) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-20">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-20">
        <div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#201b35] sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-sage">
            <UserRound size={24} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">
            {t("create.login-to-create")}
          </h1>
          <p className="mt-3 text-slate-500">{t("create.login-required")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/explore"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/15 dark:bg-[#201b35]"
            >
              {t("create.go-to-explore")}
            </Link>
            <Link
              href="/login?redirect=%2Fcreate"
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              {t("login.log-in")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (draft) {
    return (
      <main className="grid min-h-screen place-items-center px-5 pt-20">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-sage">
            <Check size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">{t("create.vision-saved")}</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            {t("create.saved-in-supabase")}
          </p>
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-5 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-sage">
              {t("create.saved-proposal")}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{draft.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {draft.placeName}
            </p>{" "}
            <p className="mt-1 text-sm font-medium text-sage">
              {draft.municipality} ·{" "}
              {t(
                draft.category,
                categoryTranslations[draft.category] || draft.category,
              )}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
              <MapPin size={14} /> {draft.location}
            </p>{" "}
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              {draft.idea}
            </p>
            {(draft.beforeImages.length || draft.afterImages.length) > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[...draft.beforeImages, ...draft.afterImages].map(
                  (image, index) => (
                    <Image
                      key={`${image.slice(0, 16)}-${index}`}
                      unoptimized
                      src={image}
                      alt={
                        index < draft.beforeImages.length
                          ? `${t("create.before-image")} ${index + 1}`
                          : `${t("create.after-image")} ${index - draft.beforeImages.length + 1}`
                      }
                      width={240}
                      height={160}
                      className="h-28 w-full rounded-xl object-cover"
                    />
                  ),
                )}
              </div>
            )}
            {draft.cost && (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
                <Coins size={16} className="text-sage" /> {t("create.budget")}:{" "}
                {new Intl.NumberFormat("sv-SE").format(Number(draft.cost))} {t("create.currency")}
              </p>
            )}
          </div>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
            >
              {t("create.go-to-explore")}
            </Link>{" "}
            <button
              onClick={() => {
                setRestoreDraft(draft);
                setDraft(null);
              }}
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold"
            >
              {t("create.continue-editing")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pb-20 pt-32 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/explore"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"
        >
          <ArrowLeft size={16} /> {t("create.cancel")}
        </Link>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">
          {t("create.your-turn")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("create.share-a-vision")}
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          {t("create.vision-description")}
        </p>{" "}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={() => setIsDirty(true)}
          className="mt-10 space-y-7"
        >
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold">
              {t("create.proposal-title")}
            </label>
            <input
              id="title"
              name="title"
              required
              minLength={3}
              placeholder={t("create.example-proposal-title")}
              className="field"
            />
          </div>
          <div>
            <label
              htmlFor="placeName"
              className="mb-2 block text-sm font-semibold"
            >
              {t("create.place-name")}
            </label>
            <input
              id="placeName"
              name="placeName"
              required
              minLength={3}
              placeholder={t("create.example-place-name")}
              className="field"
            />
          </div>{" "}
          <div>
            <label
              htmlFor="municipality"
              className="mb-2 block text-sm font-semibold"
            >
              {t("create.municipality")}
            </label>{" "}
            <div className="relative">
              <input
                id="municipality"
                name="municipality"
                autoComplete="address-level2"
                required
                minLength={2}
                value={municipalityQuery}
                onChange={(event) => {
                  setMunicipalityQuery(event.target.value);
                  setMunicipalitySuggestions([]);
                  setIsDirty(true);
                }}
                placeholder={t("create.example-municipality")}
                className="field"
              />
              {municipalitySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">
                  {municipalitySuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.latitude}-${suggestion.longitude}`}
                      type="button"
                      onClick={() => selectMunicipality(suggestion)}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10"
                    >
                      {suggestion.municipality || suggestion.displayName}
                    </button>
                  ))}
                </div>
              )}{" "}
            </div>
          </div>
          <div>
            {" "}
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold"
            >
              {t("create.proposal-category")}
            </label>
            <select
              id="category"
              name="category"
              required
              defaultValue=""
              className="field"
            >
              <option value="" disabled>
                {t("create.choose-a-category")}
              </option>
              <option value="Broar">{t("create.bridges")}</option>
              <option value="Torg">{t("create.square")}</option>
              <option value="Park">{t("create.park")}</option>
              <option value="Kollektivtrafik">
                {t("create.public-transport")}
              </option>
              <option value="Infrastruktur">
                {t("create.infrastructure")}
              </option>
              <option value="Promenad">{t("create.promenade")}</option>
              <option value="Lekplats">{t("create.playground")}</option>
              <option value="Plats">{t("create.public-space")}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="location"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <MapPin size={16} className="text-sage" /> {t("create.location")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {" "}
                <input
                  id="location"
                  name="location"
                  required
                  minLength={2}
                  value={locationQuery}
                  onChange={(event) => {
                    setLocationQuery(event.target.value);
                    setIsDirty(true);
                    setLocationSearchError(false);
                  }}
                  placeholder={t("create.search-address")}
                  className="field"
                />
                {locationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.latitude}-${suggestion.longitude}`}
                        type="button"
                        onClick={() => selectLocation(suggestion)}
                        className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10"
                      >
                        {suggestion.displayName}
                      </button>
                    ))}
                  </div>
                )}
                {locationSearchError && (
                  <p className="mt-2 text-xs text-slate-500">
                    {t("create.location-suggestions-are-unavailable-right-now")}
                  </p>
                )}
                <input id="latitude" name="latitude" type="hidden" />
                <input id="longitude" name="longitude" type="hidden" />
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold dark:border-white/15 dark:bg-[#201b35]"
              >
                <LocateFixed size={16} className="shrink-0 text-sage" /> {t("create.my-location")}
              </button>
            </div>
            {locationStatus && (
              <p className="mt-2 text-xs text-slate-500">{locationStatus}</p>
            )}
          </div>{" "}
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("create.before-images-title")}
              </p>
              <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-3 text-center transition hover:bg-mint">
                {beforeImages.length ? (
                  <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                    {beforeImages.map((image, index) => (
                      <Image
                        key={`${image.slice(0, 16)}-${index}`}
                        unoptimized
                        src={image}
                        alt={`${t("create.before-image")} ${index + 1}`}
                        width={240}
                        height={160}
                        className="h-28 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <ImagePlus className="mb-2 text-sage" />
                    <span className="text-sm font-semibold">
                      {t("create.upload-before-images")}
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      {t("create.choose-images")}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleImages(event, setBeforeImages)}
                  className="hidden"
                />
              </label>{" "}
            </div>
            {beforeImages.length > 0 && (
              <div className="step-reveal">
                <p className="mb-2 text-sm font-semibold">
                  {t("create.after-images-title")}
                </p>
                <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-3 text-center transition hover:bg-mint">
                  {afterImages.length ? (
                    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                      {afterImages.map((image, index) => (
                        <Image
                          key={`${image.slice(0, 16)}-${index}`}
                          unoptimized
                          src={image}
                          alt={`${t("create.after-image")} ${index + 1}`}
                          width={240}
                          height={160}
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="mb-2 text-sage" />
                      <span className="text-sm font-semibold">
                        {t("create.upload-after-images")}
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        {t("create.show-improvement-vision")}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => handleImages(event, setAfterImages)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {imageError && (
              <p className="text-xs font-medium text-red-600">{imageError}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="problem"
              className="mb-2 block text-sm font-semibold"
            >
              {t("create.what-to-improve")}
            </label>
            <textarea
              id="problem"
              name="problem"
              required
              minLength={10}
              rows={4}
              placeholder={t("create.describe-current-problem")}
              className="field resize-none"
            />
          </div>
          <div>
            <label htmlFor="idea" className="mb-2 block text-sm font-semibold">
              {t("create.improvement-idea")}
            </label>
            <textarea
              id="idea"
              name="idea"
              required
              minLength={10}
              rows={4}
              placeholder={t("create.describe-improvement-idea")}
              className="field resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="cost"
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
            >
              <Coins size={16} className="text-sage" /> {t("create.estimated-cost")}{" "}
              <span className="font-normal text-slate-400">({t("create.optional")})</span>
            </label>
            <div className="relative">
              <input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="1000"
                placeholder="450 000"
                className="field pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {t("create.currency")}
              </span>
            </div>
          </div>{" "}
          {submitError && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-400/30 dark:bg-[#3a1d2b] dark:text-red-100">
              <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600 dark:text-red-300" />
              <p>{submitError}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-full bg-ink py-4 text-sm font-semibold text-white transition hover:bg-sage disabled:cursor-wait disabled:opacity-70"
          >
            <Sparkles size={17} className="mr-2 inline" />{" "}
            {isSaving ? t("create.saving") : t("create.save-proposal")}
          </button>{" "}
        </form>
      </div>
      {pendingNavigation && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#201b35]"
          >
            <h2 className="text-xl font-semibold">
              {t("create.leave-this-page")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t(
                "create.you-have-unsaved-changes-do-you-want-to-leave-this-page",
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingNavigation(null)}
                className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/15"
              >
                {t("create.no-stay")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDirty(false);
                  router.push(pendingNavigation);
                }}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
              >
                {t("create.yes-leave")}
              </button>
            </div>{" "}
          </div>
        </div>
      )}
      {dialog}
    </main>
  );
}
