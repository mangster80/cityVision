"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Coins,
  Eye,
  ImagePlus,
  LocateFixed,
  Lock,
  MapPin,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
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
import { CATEGORY_CONFIGS } from "@/lib/category-config";
import { ProposalLivePreview } from "@/components/proposal-live-preview";

const LocationPickerMap = dynamic(
  () =>
    import("@/components/location-picker-map").then(
      (module) => module.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton-shimmer h-64 w-full rounded-2xl bg-slate-200 dark:bg-[#201b35]" />
    ),
  },
);

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

const QUICK_IDEAS = [
  { key: "create.idea-tag-lighting", text: "Öka trygghet och stämning med varmare belysning och ljussättning." },
  { key: "create.idea-tag-greenery", text: "Plantera fler träd, blommor, perennrabatter och gröna oaser." },
  { key: "create.idea-tag-seating", text: "Placera ut bekväma sittbänkar, picknickbord och sociala mötesplatser." },
  { key: "create.idea-tag-art", text: "Skapa en färgstark muralmålning eller konstinstallation av lokala kreatörer." },
  { key: "create.idea-tag-bike", text: "Bygg tryggare cykelstråk, cykelparkering och reparationstation." },
  { key: "create.idea-tag-play", text: "Skapa roliga lekmiljöer, hinderbana eller skateyta för barn och unga." },
];

export default function CreatePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Form states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [stepError, setStepError] = useState("");

  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [municipalityQuery, setMunicipalityQuery] = useState("");
  const [category, setCategory] = useState("Park");
  const [locationQuery, setLocationQuery] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");

  const [problem, setProblem] = useState("");
  const [idea, setIdea] = useState("");
  const [cost, setCost] = useState("");

  const [locationStatus, setLocationStatus] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<LocationSuggestion[]>([]);
  const skipMunicipalitySearch = useRef(false);
  const municipalityContainerRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { t } = useLanguage();
  const { requestDiscard, dialog } = useUnsavedChangesGuard(isDirty);

  // Step Validation checks
  const isStep1Valid = Boolean(
    title.trim().length >= 3 &&
    placeName.trim().length >= 2 &&
    municipalityQuery.trim().length >= 2 &&
    locationQuery.trim().length >= 2
  );

  const isStep2Valid = beforeImages.length > 0 && afterImages.length > 0;

  const isStep3Valid = problem.trim().length >= 10 && idea.trim().length >= 10;

  // Handle click outside for municipality and location suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        municipalityContainerRef.current &&
        !municipalityContainerRef.current.contains(target)
      ) {
        setMunicipalitySuggestions([]);
      }
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(target)
      ) {
        setLocationSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let syncRequest = 0;
    const syncSession = async () => {
      const requestId = ++syncRequest;
      const storedUser = getStoredUser();
      if (isDemoLoginEnabled() && storedUser) {
        if (requestId === syncRequest) setLoggedIn(true);
        return;
      }
      if (!supabase) {
        if (requestId === syncRequest) setLoggedIn(Boolean(storedUser));
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (requestId !== syncRequest) return;
      if (error || !data.user) {
        setLoggedIn(isDemoLoginEnabled() && Boolean(storedUser));
        return;
      }
      setLoggedIn(Boolean(data.user));
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
    setStepError("");
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    if (suggestion.municipality && !municipalityQuery) {
      setMunicipalityQuery(suggestion.municipality);
    }
  };

  const selectMunicipality = (suggestion: LocationSuggestion) => {
    skipMunicipalitySearch.current = true;
    setMunicipalityQuery(suggestion.municipality || suggestion.displayName);
    setMunicipalitySuggestions([]);
    setStepError("");
    setIsDirty(true);
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setIsDirty(true);
    if (!locationQuery) {
      setLocationQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
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
    setStepError("");
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
    if (!restoreDraft) return;
    setTitle(restoreDraft.title);
    setPlaceName(restoreDraft.placeName);
    setMunicipalityQuery(restoreDraft.municipality);
    setCategory(restoreDraft.category || "Park");
    setLocationQuery(restoreDraft.location);
    setLatitude(restoreDraft.latitude);
    setLongitude(restoreDraft.longitude);
    setProblem(restoreDraft.problem);
    setIdea(restoreDraft.idea);
    setCost(restoreDraft.cost);
    setBeforeImages(restoreDraft.beforeImages);
    setAfterImages(restoreDraft.afterImages);
    setIsDirty(true);
    setRestoreDraft(null);
  }, [restoreDraft]);

  const handleUseCurrentLocation = () => {
    setIsDirty(true);
    if (!navigator.geolocation) {
      setLocationStatus(t("create.your-browser-does-not-support-location-access"));
      return;
    }
    setLocationStatus(t("create.getting-location"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationStatus(
          `${t("create.location-selected")} ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setLocationQuery(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        setStepError("");
      },
      () =>
        setLocationStatus(
          t("create.could-not-get-your-location-check-location-permissions")
        )
    );
  };

  const handleAddQuickIdea = (quickIdeaText: string) => {
    setIsDirty(true);
    setStepError("");
    setIdea((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return quickIdeaText;
      if (trimmed.includes(quickIdeaText)) return prev;
      return `${trimmed}\n• ${quickIdeaText}`;
    });
  };

  const handleCancelClick = () => {
    requestDiscard(() => {
      setIsDirty(false);
      router.push("/explore");
    });
  };

  const handleStepTabClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setStepError("");
      setCurrentStep(1);
      return;
    }

    if (targetStep === 2) {
      if (!isStep1Valid) {
        setStepError(t("create.step1-validation-error"));
        return;
      }
      setStepError("");
      setCurrentStep(2);
      return;
    }

    if (targetStep === 3) {
      if (!isStep1Valid) {
        setStepError(t("create.step1-validation-error"));
        setCurrentStep(1);
        return;
      }
      if (!isStep2Valid) {
        setStepError(t("create.step2-validation-error"));
        setCurrentStep(2);
        return;
      }
      setStepError("");
      setCurrentStep(3);
      return;
    }
  };

  const handleProceedToStep2 = () => {
    if (!isStep1Valid) {
      setStepError(t("create.step1-validation-error"));
      return;
    }
    setStepError("");
    setCurrentStep(2);
  };

  const handleProceedToStep3 = () => {
    if (!isStep2Valid) {
      setImageError(t("create.step2-validation-error"));
      setStepError(t("create.step2-validation-error"));
      return;
    }
    setImageError("");
    setStepError("");
    setCurrentStep(3);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setStepError("");

    if (!isStep1Valid) {
      setStepError(t("create.step1-validation-error"));
      setCurrentStep(1);
      return;
    }

    if (!isStep2Valid) {
      setImageError(t("create.step2-validation-error"));
      setStepError(t("create.step2-validation-error"));
      setCurrentStep(2);
      return;
    }

    if (!isStep3Valid) {
      setStepError(t("create.step3-validation-error"));
      return;
    }

    const nextDraft: Draft = {
      placeName: placeName.trim(),
      municipality: municipalityQuery.trim(),
      title: title.trim(),
      category: category.trim() || "Plats",
      location: locationQuery.trim(),
      latitude,
      longitude,
      problem: problem.trim(),
      idea: idea.trim(),
      cost: cost.trim(),
      beforeImages,
      afterImages,
    };

    setIsSaving(true);
    let proposalId: string | null = null;
    try {
      proposalId = await createSupabaseProposal(nextDraft);
      setCreatedProposalId(proposalId);
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
      <main className="px-5 pb-20 pt-32 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-sage">
            <Check size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">{t("create.vision-saved")}</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            {t("create.saved-in-supabase")}
          </p>

          <div className="mt-8 text-left">
            <ProposalLivePreview
              title={draft.title}
              placeName={draft.placeName}
              municipality={draft.municipality}
              category={draft.category}
              location={draft.location}
              problem={draft.problem}
              idea={draft.idea}
              cost={draft.cost}
              beforeImages={draft.beforeImages}
              afterImages={draft.afterImages}
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {createdProposalId && (
              <Link
                href={`/proposal/${createdProposalId}`}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7056d8]"
              >
                {t("create.view-proposal")}
              </Link>
            )}
            <Link
              href="/explore"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
            >
              {t("create.go-to-explore")}
            </Link>
            <button
              onClick={() => {
                setRestoreDraft(draft);
                setDraft(null);
              }}
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleCancelClick}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-ink dark:hover:text-white"
          >
            <ArrowLeft size={16} /> {t("create.cancel")}
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-full border border-sage/30 bg-mint px-4 py-2 text-xs font-semibold text-sage transition hover:bg-sage hover:text-white dark:bg-[#292044] dark:hover:bg-sage lg:hidden"
          >
            <Eye size={14} />
            <span>{t("create.live-preview")}</span>
          </button>
        </div>

        <div className="text-center sm:text-left">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-sage">
            {t("create.your-turn")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("create.share-a-vision")}
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            {t("create.vision-description")}
          </p>
        </div>

        {/* Step Tabs / Progress Wizard */}
        <div className="mt-8 grid grid-cols-3 gap-2 border-b border-black/5 pb-4 dark:border-white/10 sm:gap-4">
          {[
            {
              step: 1,
              label: t("create.step1"),
              isUnlocked: true,
              isComplete: isStep1Valid,
            },
            {
              step: 2,
              label: t("create.step2"),
              isUnlocked: isStep1Valid,
              isComplete: isStep2Valid,
            },
            {
              step: 3,
              label: t("create.step3"),
              isUnlocked: isStep1Valid && isStep2Valid,
              isComplete: isStep3Valid,
            },
          ].map(({ step, label, isUnlocked, isComplete }) => {
            const isActive = currentStep === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => handleStepTabClick(step as 1 | 2 | 3)}
                title={!isUnlocked ? t("create.step-locked-hint") : undefined}
                className={`group flex items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs font-bold transition sm:gap-2 sm:text-sm ${
                  isActive
                    ? "bg-ink text-white shadow-md dark:bg-mint dark:text-ink"
                    : isComplete
                    ? "bg-mint text-sage hover:bg-mint/80 dark:bg-[#292044]"
                    : isUnlocked
                    ? "bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
                    : "cursor-not-allowed bg-black/5 text-slate-400 opacity-60 dark:bg-white/5 dark:text-slate-600"
                }`}
              >
                {!isUnlocked ? (
                  <Lock size={14} className="shrink-0 opacity-60" />
                ) : isComplete && !isActive ? (
                  <Check size={14} className="shrink-0 text-sage" />
                ) : null}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Step Validation Alert Banner */}
        {stepError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-[#382b1b] dark:text-amber-100"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>{stepError}</p>
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main Form Section */}
          <div>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onChange={() => setIsDirty(true)}
              className="space-y-7"
            >
              {/* STEP 1: Place, Category, Location & Map */}
              {currentStep === 1 && (
                <div className="step-reveal space-y-6">
                  <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-semibold">
                      {t("create.proposal-title")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      required
                      minLength={3}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setStepError("");
                        setIsDirty(true);
                      }}
                      placeholder={t("create.example-proposal-title")}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor="placeName" className="mb-2 block text-sm font-semibold">
                      {t("create.place-name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="placeName"
                      name="placeName"
                      required
                      minLength={2}
                      value={placeName}
                      onChange={(e) => {
                        setPlaceName(e.target.value);
                        setStepError("");
                        setIsDirty(true);
                      }}
                      placeholder={t("create.example-place-name")}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor="municipality" className="mb-2 block text-sm font-semibold">
                      {t("create.municipality")} <span className="text-red-500">*</span>
                    </label>
                    <div ref={municipalityContainerRef} className="relative">
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
                          setStepError("");
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
                      )}
                    </div>
                  </div>

                  {/* Category Pill Tiles */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold">
                      {t("create.proposal-category")}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {Object.entries(CATEGORY_CONFIGS).map(([catKey, catConf]) => {
                        const isSelected = category === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => {
                              setCategory(catKey);
                              setIsDirty(true);
                            }}
                            className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left text-xs font-semibold transition ${
                              isSelected
                                ? "border-transparent text-white shadow-md"
                                : "border-black/10 bg-white text-ink hover:border-black/20 dark:border-white/10 dark:bg-[#201b35] dark:text-white"
                            }`}
                            style={{
                              backgroundColor: isSelected ? catConf.color : undefined,
                            }}
                          >
                            <span
                              className="shrink-0 h-4 w-4"
                              dangerouslySetInnerHTML={{ __html: catConf.iconSvg }}
                            />
                            <span className="truncate">{t(catConf.translationKey) || catKey}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location Search & Interactive Map */}
                  <div>
                    <label htmlFor="location" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <MapPin size={16} className="text-sage" /> {t("create.location")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div ref={locationContainerRef} className="relative flex-1">
                        <input
                          id="location"
                          name="location"
                          required
                          minLength={2}
                          value={locationQuery}
                          onChange={(event) => {
                            setLocationQuery(event.target.value);
                            setStepError("");
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
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="flex shrink-0 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                      >
                        <LocateFixed size={16} className="shrink-0 text-sage" /> {t("create.my-location")}
                      </button>
                    </div>
                    {locationStatus && (
                      <p className="mt-2 text-xs text-slate-500">{locationStatus}</p>
                    )}

                    <div className="mt-3">
                      <LocationPickerMap
                        latitude={latitude}
                        longitude={longitude}
                        category={category}
                        placeName={placeName}
                        onLocationChange={handleMapLocationChange}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-sage shadow-md"
                    >
                      <span>{t("create.next-step")}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Before & Vision Images */}
              {currentStep === 2 && (
                <div className="step-reveal space-y-6">
                  <div>
                    <p className="mb-2 text-sm font-semibold">
                      {t("create.before-images-title")} <span className="text-red-500">*</span>
                    </p>
                    <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-4 text-center transition hover:bg-mint dark:bg-[#292044]/30 dark:hover:bg-[#292044]/60">
                      {beforeImages.length ? (
                        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                          {beforeImages.map((image, index) => (
                            <div key={`${image.slice(0, 16)}-${index}`} className="relative">
                              <Image
                                unoptimized
                                src={image}
                                alt={`${t("create.before-image")} ${index + 1}`}
                                width={240}
                                height={160}
                                className="h-28 w-full rounded-xl object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImage(beforeImages, index, setBeforeImages);
                                }}
                                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-lg leading-none text-white shadow-md transition hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="mb-2 text-sage" size={28} />
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
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold">
                      {t("create.after-images-title")} <span className="text-red-500">*</span>
                    </p>
                    <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-sage/30 bg-mint/40 p-4 text-center transition hover:bg-mint dark:bg-[#292044]/30 dark:hover:bg-[#292044]/60">
                      {afterImages.length ? (
                        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                          {afterImages.map((image, index) => (
                            <div key={`${image.slice(0, 16)}-${index}`} className="relative">
                              <Image
                                unoptimized
                                src={image}
                                alt={`${t("create.after-image")} ${index + 1}`}
                                width={240}
                                height={160}
                                className="h-28 w-full rounded-xl object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImage(afterImages, index, setAfterImages);
                                }}
                                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-lg leading-none text-white shadow-md transition hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="mb-2 text-sage" size={28} />
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

                  {imageError && (
                    <p className="text-xs font-medium text-red-600">{imageError}</p>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        setCurrentStep(1);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                    >
                      <ArrowLeft size={16} />
                      <span>{t("create.prev-step")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToStep3}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-sage shadow-md"
                    >
                      <span>{t("create.next-step")}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Problem, Idea, Quick Inspiration Tags & Budget */}
              {currentStep === 3 && (
                <div className="step-reveal space-y-6">
                  <div>
                    <label htmlFor="problem" className="mb-2 block text-sm font-semibold">
                      {t("create.what-to-improve")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="problem"
                      name="problem"
                      required
                      minLength={10}
                      rows={3}
                      value={problem}
                      onChange={(e) => {
                        setProblem(e.target.value);
                        setStepError("");
                        setIsDirty(true);
                      }}
                      placeholder={t("create.describe-current-problem")}
                      className="field resize-none"
                    />
                  </div>

                  {/* Quick Inspiration Tags */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-sage">
                      {t("create.quick-ideas-title")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_IDEAS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleAddQuickIdea(item.text)}
                          className="rounded-full border border-sage/20 bg-mint/50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sage hover:bg-mint hover:text-sage dark:border-white/10 dark:bg-[#292044]/50 dark:text-slate-300 dark:hover:bg-[#292044]"
                        >
                          {t(item.key)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="idea" className="mb-2 block text-sm font-semibold">
                      {t("create.improvement-idea")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="idea"
                      name="idea"
                      required
                      minLength={10}
                      rows={4}
                      value={idea}
                      onChange={(e) => {
                        setIdea(e.target.value);
                        setStepError("");
                        setIsDirty(true);
                      }}
                      placeholder={t("create.describe-improvement-idea")}
                      className="field resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="cost" className="mb-2 flex items-center gap-2 text-sm font-semibold">
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
                        value={cost}
                        onChange={(e) => {
                          setCost(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="450 000"
                        className="field pr-14"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {t("create.currency")}
                      </span>
                    </div>
                  </div>

                  {submitError && (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-400/30 dark:bg-[#3a1d2b] dark:text-red-100">
                      <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600 dark:text-red-300" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        setCurrentStep(2);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                    >
                      <ArrowLeft size={16} />
                      <span>{t("create.prev-step")}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white transition hover:bg-sage disabled:cursor-wait disabled:opacity-70 shadow-lg"
                    >
                      <Sparkles size={17} />
                      <span>{isSaving ? t("create.saving") : t("create.save-proposal")}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Live Preview Column (Sticky on Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <ProposalLivePreview
                title={title}
                placeName={placeName}
                municipality={municipalityQuery}
                category={category}
                location={locationQuery}
                problem={problem}
                idea={idea}
                cost={cost}
                beforeImages={beforeImages}
                afterImages={afterImages}
              />
            </div>
          </div>
        </div>

        {/* Mobile Modal / Overlay Preview */}
        {showPreview && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-md lg:hidden">
            <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#201b35]">
              <div className="flex items-center justify-between border-b border-black/5 bg-slate-50/80 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
                <span className="text-sm font-semibold text-ink dark:text-white">
                  {t("create.live-preview")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-[#292044] dark:text-white"
                >
                  <X size={14} />
                  <span>{t("gallery.close")}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ProposalLivePreview
                  title={title}
                  placeName={placeName}
                  municipality={municipalityQuery}
                  category={category}
                  location={locationQuery}
                  problem={problem}
                  idea={idea}
                  cost={cost}
                  beforeImages={beforeImages}
                  afterImages={afterImages}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {dialog}
    </main>
  );
}
