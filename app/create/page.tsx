"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Building2,
  Check,
  Coins,
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  LocateFixed,
  Lock,
  MapPin,
  PartyPopper,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getStoredUser, isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";
import {
  LocationSuggestion,
  POPULAR_MUNICIPALITIES,
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
  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);
  const [draggedBeforeIndex, setDraggedBeforeIndex] = useState<number | null>(null);
  const [draggedAfterIndex, setDraggedAfterIndex] = useState<number | null>(null);

  const [problem, setProblem] = useState("");
  const [idea, setIdea] = useState("");
  const [cost, setCost] = useState("");

  const [locationStatus, setLocationStatus] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingMunicipality, setIsSearchingMunicipality] = useState(false);
  const [isMunicipalityFocused, setIsMunicipalityFocused] = useState(false);
  const [highlightedMunicipalityIndex, setHighlightedMunicipalityIndex] = useState(-1);
  const skipMunicipalitySearch = useRef(false);
  const municipalityContainerRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const lastLocationRequestTime = useRef(0);
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
        setIsMunicipalityFocused(false);
        setHighlightedMunicipalityIndex(-1);
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
    const trimmed = municipalityQuery.trim();
    if (!trimmed) {
      setMunicipalitySuggestions([]);
      setIsSearchingMunicipality(false);
      return;
    }

    setIsSearchingMunicipality(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void searchMunicipalities(municipalityQuery, controller.signal)
        .then((suggestions) => {
          setMunicipalitySuggestions(suggestions);
          setHighlightedMunicipalityIndex(-1);
          setIsSearchingMunicipality(false);
        })
        .catch((error) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setMunicipalitySuggestions([]);
            setIsSearchingMunicipality(false);
          }
        });
    }, 300);
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
    setIsMunicipalityFocused(false);
    setHighlightedMunicipalityIndex(-1);
    setStepError("");
    setIsDirty(true);
    if (latitude === null || longitude === null) {
      setLatitude(suggestion.latitude);
      setLongitude(suggestion.longitude);
    }
  };

  const handleMunicipalityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list =
      municipalitySuggestions.length > 0
        ? municipalitySuggestions
        : isMunicipalityFocused && !municipalityQuery.trim()
        ? POPULAR_MUNICIPALITIES
        : [];

    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedMunicipalityIndex((prev) =>
        prev < list.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedMunicipalityIndex((prev) =>
        prev > 0 ? prev - 1 : list.length - 1,
      );
    } else if (
      e.key === "Enter" &&
      highlightedMunicipalityIndex >= 0 &&
      highlightedMunicipalityIndex < list.length
    ) {
      e.preventDefault();
      selectMunicipality(list[highlightedMunicipalityIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMunicipalitySuggestions([]);
      setIsMunicipalityFocused(false);
      setHighlightedMunicipalityIndex(-1);
    }
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setIsDirty(true);
    if (!locationQuery) {
      setLocationQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const processFiles = (
    files: File[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
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
      .then((newImages) => {
        setImages((prev) => [...prev, ...newImages]);
      })
      .catch(() => setImageError(t("create.the-images-could-not-be-loaded")));
  };

  const handleFileInput = (
    event: ChangeEvent<HTMLInputElement>,
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    processFiles(files, setImages);
    event.target.value = "";
  };

  const handleDropFiles = (
    e: React.DragEvent<HTMLElement>,
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
    setIsDragging: (val: boolean) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.types.includes("application/x-cityvision-reorder")) {
      return;
    }

    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) {
      processFiles(files, setImages);
    }
  };

  const handleReorder = (
    type: "before" | "after",
    fromIndex: number,
    toIndex: number,
  ) => {
    if (fromIndex === toIndex) return;
    if (type === "before") {
      setBeforeImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    } else {
      setAfterImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    }
    setIsDirty(true);
  };

  const removeImage = (
    index: number,
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
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
    if (isLocating) return;

    // Throttle location clicks to prevent spamming GPS / Nominatim API
    const now = Date.now();
    if (now - lastLocationRequestTime.current < 2500) {
      return;
    }
    lastLocationRequestTime.current = now;

    setIsDirty(true);
    if (!navigator.geolocation) {
      setLocationStatus(t("create.your-browser-does-not-support-location-access"));
      return;
    }
    setIsLocating(true);
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
        setIsLocating(false);
      },
      () => {
        setLocationStatus(
          t("create.could-not-get-your-location-check-location-permissions")
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
      <main className="px-5 pb-24 pt-28 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Animated Celebration Banner & Icon */}
          <div className="relative mx-auto mb-6 flex flex-col items-center">
            {/* Glowing backdrop rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-24 w-24 rounded-full bg-emerald-400/20 blur-xl dark:bg-emerald-500/30 animate-pulse" />
              <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-white shadow-xl shadow-emerald-500/25 ring-4 ring-emerald-500/20">
                <Check size={38} className="stroke-[3.5] drop-shadow-sm" />
              </div>
            </div>

            {/* Sparkle badge */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles size={14} className="text-emerald-500" />
              <span>{t("create.status-published")}</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink dark:text-white sm:text-4xl">
            {t("create.vision-published-success")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-slate-600 dark:text-slate-300">
            {t("create.saved-in-supabase")}
          </p>

          {/* Action Callouts */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {createdProposalId && (
              <Link
                href={`/proposal/${createdProposalId}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:scale-105 hover:bg-[#7056d8] active:scale-95 dark:bg-mint dark:text-ink dark:hover:bg-white"
              >
                <Rocket size={16} />
                <span>{t("create.view-proposal")}</span>
              </Link>
            )}
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-ink shadow-xs transition hover:bg-black/5 dark:border-white/15 dark:bg-[#201b35] dark:text-white dark:hover:bg-white/5"
            >
              <Building2 size={16} />
              <span>{t("create.go-to-explore")}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setRestoreDraft(draft);
                setDraft(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-black/5 dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300 dark:hover:bg-white/5"
            >
              <RotateCcw size={15} />
              <span>{t("create.continue-editing")}</span>
            </button>
          </div>

          {/* Proposal Card Preview */}
          <div className="mt-12 text-left">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("create.saved-proposal")}
              </span>
            </div>
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
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pb-32 pt-32 sm:px-10 sm:pb-20">
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

        {/* Progress Bar and Wizard Step Tabs */}
        <div className="mt-8 space-y-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? "33.33%" : currentStep === 2 ? "66.66%" : "100%",
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-black/5 pb-4 dark:border-white/10 sm:gap-4">
            {[
              {
                step: 1,
                label: t("create.step1"),
                shortLabel: "1. Plats",
                isUnlocked: true,
                isComplete: isStep1Valid,
              },
              {
                step: 2,
                label: t("create.step2"),
                shortLabel: "2. Bilder",
                isUnlocked: isStep1Valid,
                isComplete: isStep2Valid,
              },
              {
                step: 3,
                label: t("create.step3"),
                shortLabel: "3. Detaljer",
                isUnlocked: isStep1Valid && isStep2Valid,
                isComplete: isStep3Valid,
              },
            ].map(({ step, label, shortLabel, isUnlocked, isComplete }) => {
              const isActive = currentStep === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleStepTabClick(step as 1 | 2 | 3)}
                  title={!isUnlocked ? t("create.step-locked-hint") : undefined}
                  className={`group flex items-center justify-center gap-1.5 rounded-2xl p-2.5 sm:p-3 text-center text-xs font-bold transition-all duration-200 active:scale-[0.98] sm:gap-2 sm:text-sm ${
                    isActive
                      ? "bg-ink text-white shadow-md ring-2 ring-sage/30 dark:bg-mint dark:text-ink dark:ring-sage/40"
                      : isComplete
                      ? "bg-mint text-sage hover:bg-mint/80 dark:bg-[#292044]"
                      : isUnlocked
                      ? "bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
                      : "cursor-not-allowed bg-black/5 text-slate-400 opacity-50 dark:bg-white/5 dark:text-slate-600"
                  }`}
                >
                  {!isUnlocked ? (
                    <Lock size={13} className="shrink-0 opacity-60" />
                  ) : isComplete && !isActive ? (
                    <Check size={14} className="shrink-0 text-sage stroke-[3]" />
                  ) : null}
                  <span className="hidden sm:inline truncate">{label}</span>
                  <span className="inline sm:hidden truncate">{shortLabel}</span>
                </button>
              );
            })}
          </div>
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
                    <label htmlFor="municipality" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Building2 size={16} className="text-sage" /> {t("create.municipality")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div ref={municipalityContainerRef} className="relative">
                      <div className="relative flex items-center">
                        <input
                          id="municipality"
                          name="municipality"
                          role="combobox"
                          aria-expanded={municipalitySuggestions.length > 0 || (isMunicipalityFocused && !municipalityQuery.trim())}
                          aria-autocomplete="list"
                          autoComplete="off"
                          required
                          minLength={2}
                          value={municipalityQuery}
                          onFocus={() => setIsMunicipalityFocused(true)}
                          onChange={(event) => {
                            setMunicipalityQuery(event.target.value);
                            setStepError("");
                            setIsDirty(true);
                          }}
                          onKeyDown={handleMunicipalityKeyDown}
                          placeholder={t("create.example-municipality")}
                          className="field pr-20"
                        />
                        <div className="absolute right-3.5 flex items-center gap-1.5 text-slate-400">
                          {isSearchingMunicipality && (
                            <Loader2 size={16} className="animate-spin text-sage" />
                          )}
                          {municipalityQuery && (
                            <button
                              type="button"
                              aria-label={t("explore.clear-search")}
                              onClick={() => {
                                setMunicipalityQuery("");
                                setMunicipalitySuggestions([]);
                                setHighlightedMunicipalityIndex(-1);
                              }}
                              className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Suggestions */}
                      {municipalitySuggestions.length > 0 && (
                        <div
                          role="listbox"
                          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#201b35]"
                        >
                          {municipalitySuggestions.map((suggestion, index) => {
                            const isHighlighted = index === highlightedMunicipalityIndex;
                            return (
                              <button
                                key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.displayName}`}
                                role="option"
                                aria-selected={isHighlighted}
                                type="button"
                                onClick={() => selectMunicipality(suggestion)}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                                  isHighlighted
                                    ? "bg-mint font-semibold text-sage dark:bg-white/15 dark:text-white"
                                    : "text-ink hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                                }`}
                              >
                                <Building2 size={15} className="shrink-0 text-sage" />
                                <span className="truncate">{suggestion.municipality || suggestion.displayName}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Popular Municipalities when focused and query is empty */}
                      {isMunicipalityFocused && !municipalityQuery.trim() && municipalitySuggestions.length === 0 && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#201b35]">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t("create.popular-municipalities")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {POPULAR_MUNICIPALITIES.map((pop, index) => {
                              const isHighlighted = index === highlightedMunicipalityIndex;
                              return (
                                <button
                                  key={pop.displayName}
                                  type="button"
                                  onClick={() => selectMunicipality(pop)}
                                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                                    isHighlighted
                                      ? "border-sage bg-mint text-sage dark:bg-white/15 dark:text-white"
                                      : "border-black/5 bg-slate-50 text-slate-700 hover:border-sage/40 hover:bg-mint/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                  }`}
                                >
                                  <Building2 size={12} className="text-sage" />
                                  <span>{pop.municipality.replace(/\s+kommun$/i, "")}</span>
                                </button>
                              );
                            })}
                          </div>
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
                            className={`group flex items-center gap-2.5 rounded-2xl border p-3 text-left text-xs font-semibold transition-all duration-200 active:scale-95 ${
                              isSelected
                                ? "border-transparent text-white shadow-md"
                                : "border-black/10 bg-white text-ink hover:border-black/20 hover:shadow-xs dark:border-white/10 dark:bg-[#201b35] dark:text-white dark:hover:border-white/20"
                            }`}
                            style={{
                              backgroundColor: isSelected ? catConf.color : undefined,
                            }}
                          >
                            <span
                              className="shrink-0 h-4 w-4 transition-transform group-hover:scale-110"
                              dangerouslySetInnerHTML={{ __html: catConf.iconSvg }}
                            />
                            <span className="truncate">{t(catConf.translationKey) || catKey}</span>
                            {isSelected && (
                              <Check size={13} className="ml-auto shrink-0 text-white stroke-[3]" />
                            )}
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
                        disabled={isLocating}
                        className="flex shrink-0 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                      >
                        {isLocating ? (
                          <Loader2 size={16} className="shrink-0 animate-spin text-sage" />
                        ) : (
                          <LocateFixed size={16} className="shrink-0 text-sage" />
                        )}
                        <span>{isLocating ? t("create.getting-location") : t("create.my-location")}</span>
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

                  <div className="hidden lg:flex justify-end pt-4">
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
                  {/* Before Images Dropzone */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {t("create.before-images-title")} <span className="text-red-500">*</span>
                      </p>
                      {beforeImages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {t("create.drag-to-reorder")}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {beforeImages.length} {beforeImages.length === 1 ? "bild" : "bilder"}
                          </span>
                        </div>
                      )}
                    </div>
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedBeforeIndex === null) {
                          setIsDraggingBefore(true);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedBeforeIndex === null) {
                          setIsDraggingBefore(true);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setIsDraggingBefore(false);
                        }
                      }}
                      onDrop={(e) => handleDropFiles(e, setBeforeImages, setIsDraggingBefore)}
                      className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
                        isDraggingBefore
                          ? "border-sage bg-mint/90 ring-4 ring-sage/30 scale-[1.01] dark:bg-[#342456]"
                          : "border-sage/30 bg-mint/30 hover:border-sage hover:bg-mint/60 active:scale-[0.99] dark:bg-[#292044]/30 dark:hover:bg-[#292044]/60"
                      }`}
                    >
                      {isDraggingBefore && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-mint/95 backdrop-blur-xs dark:bg-[#201b35]/95">
                          <UploadCloud className="mb-2 animate-bounce text-sage" size={40} />
                          <p className="text-sm font-bold text-ink dark:text-white">
                            {t("create.drop-images-here")}
                          </p>
                        </div>
                      )}
                      {beforeImages.length ? (
                        <div className="w-full space-y-3">
                          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                            {beforeImages.map((image, index) => (
                              <div
                                key={`${image.slice(0, 16)}-${index}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("application/x-cityvision-reorder", "true");
                                  e.dataTransfer.effectAllowed = "move";
                                  setDraggedBeforeIndex(index);
                                }}
                                onDragEnd={() => setDraggedBeforeIndex(null)}
                                onDragOver={(e) => {
                                  if (draggedBeforeIndex !== null) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                  }
                                }}
                                onDrop={(e) => {
                                  if (draggedBeforeIndex !== null) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleReorder("before", draggedBeforeIndex, index);
                                    setDraggedBeforeIndex(null);
                                  }
                                }}
                                title={t("create.drag-to-reorder")}
                                className={`group relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                  draggedBeforeIndex === index
                                    ? "opacity-40 ring-2 ring-sage scale-95"
                                    : "hover:shadow-md"
                                }`}
                              >
                                <Image
                                  unoptimized
                                  src={image}
                                  alt={`${t("create.before-image")} ${index + 1}`}
                                  width={240}
                                  height={160}
                                  className="h-28 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                  <GripVertical size={10} className="text-slate-300" />
                                  <span>{index + 1}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeImage(index, setBeforeImages);
                                  }}
                                  aria-label={t("create.remove-image")}
                                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-white shadow-md transition hover:bg-red-600 hover:scale-110 active:scale-95"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-center gap-1.5 pt-1 text-xs font-semibold text-sage">
                            <Plus size={14} />
                            <span>{t("create.upload-before-images")}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="mb-2 text-sage transition-transform group-hover:scale-110" size={32} />
                          <span className="text-sm font-semibold">
                            {t("create.upload-before-images")}
                          </span>
                          <span className="mt-1 text-xs text-slate-400">
                            {t("create.drag-and-drop-hint")}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handleFileInput(event, setBeforeImages)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* After Images Dropzone */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {t("create.after-images-title")} <span className="text-red-500">*</span>
                      </p>
                      {afterImages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {t("create.drag-to-reorder")}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {afterImages.length} {afterImages.length === 1 ? "bild" : "bilder"}
                          </span>
                        </div>
                      )}
                    </div>
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedAfterIndex === null) {
                          setIsDraggingAfter(true);
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedAfterIndex === null) {
                          setIsDraggingAfter(true);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setIsDraggingAfter(false);
                        }
                      }}
                      onDrop={(e) => handleDropFiles(e, setAfterImages, setIsDraggingAfter)}
                      className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
                        isDraggingAfter
                          ? "border-sage bg-mint/90 ring-4 ring-sage/30 scale-[1.01] dark:bg-[#342456]"
                          : "border-sage/30 bg-mint/30 hover:border-sage hover:bg-mint/60 active:scale-[0.99] dark:bg-[#292044]/30 dark:hover:bg-[#292044]/60"
                      }`}
                    >
                      {isDraggingAfter && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-mint/95 backdrop-blur-xs dark:bg-[#201b35]/95">
                          <UploadCloud className="mb-2 animate-bounce text-sage" size={40} />
                          <p className="text-sm font-bold text-ink dark:text-white">
                            {t("create.drop-images-here")}
                          </p>
                        </div>
                      )}
                      {afterImages.length ? (
                        <div className="w-full space-y-3">
                          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                            {afterImages.map((image, index) => (
                              <div
                                key={`${image.slice(0, 16)}-${index}`}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("application/x-cityvision-reorder", "true");
                                  e.dataTransfer.effectAllowed = "move";
                                  setDraggedAfterIndex(index);
                                }}
                                onDragEnd={() => setDraggedAfterIndex(null)}
                                onDragOver={(e) => {
                                  if (draggedAfterIndex !== null) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                  }
                                }}
                                onDrop={(e) => {
                                  if (draggedAfterIndex !== null) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleReorder("after", draggedAfterIndex, index);
                                    setDraggedAfterIndex(null);
                                  }
                                }}
                                title={t("create.drag-to-reorder")}
                                className={`group relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                  draggedAfterIndex === index
                                    ? "opacity-40 ring-2 ring-sage scale-95"
                                    : "hover:shadow-md"
                                }`}
                              >
                                <Image
                                  unoptimized
                                  src={image}
                                  alt={`${t("create.after-image")} ${index + 1}`}
                                  width={240}
                                  height={160}
                                  className="h-28 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                  <GripVertical size={10} className="text-slate-300" />
                                  <span>{index + 1}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeImage(index, setAfterImages);
                                  }}
                                  aria-label={t("create.remove-image")}
                                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/85 text-white shadow-md transition hover:bg-red-600 hover:scale-110 active:scale-95"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-center gap-1.5 pt-1 text-xs font-semibold text-sage">
                            <Plus size={14} />
                            <span>{t("create.upload-after-images")}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="mb-2 text-sage transition-transform group-hover:scale-110" size={32} />
                          <span className="text-sm font-semibold">
                            {t("create.upload-after-images")}
                          </span>
                          <span className="mt-1 text-xs text-slate-400">
                            {t("create.drag-and-drop-hint")}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handleFileInput(event, setAfterImages)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {imageError && (
                    <p className="text-xs font-medium text-red-600">{imageError}</p>
                  )}

                  <div className="hidden lg:flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        setCurrentStep(1);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-slate-50 active:scale-95 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                    >
                      <ArrowLeft size={16} />
                      <span>{t("create.prev-step")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToStep3}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-sage active:scale-95"
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
                      {QUICK_IDEAS.map((item) => {
                        const isAdded = idea.includes(item.text);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleAddQuickIdea(item.text)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 ${
                              isAdded
                                ? "border-sage bg-mint text-sage font-semibold dark:border-sage/40 dark:bg-[#292044]"
                                : "border-sage/20 bg-mint/40 text-slate-700 hover:border-sage hover:bg-mint hover:text-sage dark:border-white/10 dark:bg-[#292044]/40 dark:text-slate-300 dark:hover:bg-[#292044]"
                            }`}
                          >
                            {isAdded && <Check size={12} className="shrink-0 text-sage stroke-[3]" />}
                            <span>{t(item.key)}</span>
                          </button>
                        );
                      })}
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
                      <Coins size={16} className="text-amber-500 dark:text-amber-400" /> {t("create.estimated-cost")}{" "}
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

                  <div className="hidden lg:flex flex-wrap items-center justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStepError("");
                        setCurrentStep(2);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-slate-50 active:scale-95 dark:border-white/15 dark:bg-[#201b35] dark:hover:bg-white/5"
                    >
                      <ArrowLeft size={16} />
                      <span>{t("create.prev-step")}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-sage active:scale-95 disabled:cursor-wait disabled:opacity-70"
                    >
                      {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
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

        {/* Mobile Modal / Overlay Preview Drawer */}
        {showPreview && (
          <div
            onClick={() => setShowPreview(false)}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 lg:hidden"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 dark:bg-[#201b35]"
            >
              <div className="flex items-center justify-between border-b border-black/5 bg-slate-50/80 px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-sage" />
                  <span className="text-sm font-bold text-ink dark:text-white">
                    {t("create.live-preview")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  aria-label={t("gallery.close")}
                  className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-ink shadow-xs transition hover:bg-slate-50 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-[#292044] dark:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-1">
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

        {/* Floating Mobile Sticky Action Bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a1429]/95 lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <Eye size={15} className="text-sage" />
              <span>{t("create.live-preview")}</span>
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setStepError("");
                    setCurrentStep((prev) => (prev - 1) as 1 | 2);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white text-slate-600 shadow-xs transition active:scale-95 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-300"
                  aria-label={t("create.prev-step")}
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={currentStep === 1 ? handleProceedToStep2 : handleProceedToStep3}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 dark:bg-mint dark:text-ink"
                >
                  <span>{t("create.next-step")}</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => formRef.current?.requestSubmit()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60 dark:bg-mint dark:text-ink"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isSaving ? t("create.saving") : t("create.save-proposal")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {dialog}
    </main>
  );
}
