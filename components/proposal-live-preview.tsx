"use client";

import Image from "next/image";
import { Coins, Eye, MapPin, Sparkles, UserRound } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { getCategoryConfig } from "@/lib/category-config";
import { getStoredUser } from "@/services/user-storage";
import { ComparisonSlider } from "@/components/comparison-slider";

interface ProposalLivePreviewProps {
  title: string;
  placeName: string;
  municipality: string;
  category: string;
  location: string;
  problem: string;
  idea: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
}

export function ProposalLivePreview({
  title,
  placeName,
  municipality,
  category,
  location,
  problem,
  idea,
  cost,
  beforeImages,
  afterImages,
}: ProposalLivePreviewProps) {
  const { t } = useLanguage();
  const config = getCategoryConfig(category);
  const user = getStoredUser();

  const hasBefore = beforeImages.length > 0;
  const hasAfter = afterImages.length > 0;
  const canCompare = hasBefore && hasAfter;

  const displayTitle = title.trim() || t("create.preview-title-placeholder");
  const displayPlace = placeName.trim() || t("create.preview-place-placeholder");
  const displayMunicipality = municipality.trim() || t("create.preview-municipality-placeholder");
  const displayCategory = category || "Plats";
  const displayLocation = location.trim() || t("create.preview-location-placeholder");
  const displayProblem = problem.trim();
  const displayIdea = idea.trim();

  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">
      <div className="flex items-center justify-between border-b border-black/5 bg-slate-50/80 px-6 py-4 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-sage" />
          <span className="text-xs font-bold uppercase tracking-[.18em] text-sage">
            {t("create.live-preview")}
          </span>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-sage dark:bg-[#292044]">
          {t("create.preview-badge")}
        </span>
      </div>

      <div className="p-6 sm:p-8">
        {/* Visual Media Header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          {canCompare ? (
            <div className="h-[280px] w-full sm:h-[340px]">
              <ComparisonSlider
                beforeImage={beforeImages[0]}
                afterImage={afterImages[0]}
                beforeLabel={t("create.before-image")}
                afterLabel={t("create.after-image")}
              />
            </div>
          ) : hasBefore || hasAfter ? (
            <div className="relative h-[280px] w-full sm:h-[340px]">
              <Image
                src={hasAfter ? afterImages[0] : beforeImages[0]}
                alt={displayTitle}
                fill
                unoptimized
                className="object-cover"
              />
              <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {hasAfter ? t("create.after-image") : t("create.before-image")}
              </span>
            </div>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center bg-slate-100 p-6 text-center text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <Sparkles size={28} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">{t("create.no-images-uploaded-yet")}</p>
            </div>
          )}
        </div>

        {/* Place & Category Pills */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: config.color }}
          >
            <span
              className="inline-block h-3.5 w-3.5"
              dangerouslySetInnerHTML={{ __html: config.iconSvg }}
            />
            {t(config.translationKey) || displayCategory}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {displayMunicipality}
          </span>
        </div>

        {/* Title & Author */}
        <h2 className="text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
          {displayTitle}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {displayPlace}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-sage" />
            {displayLocation}
          </span>
        </div>

        {/* User Author Card */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50/60 p-3 dark:border-white/5 dark:bg-white/[0.02]">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-mint text-sage">
              <UserRound size={18} />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-ink dark:text-white">
              {user?.name || "Demouser"}
            </p>
            <p className="text-[11px] text-slate-400">
              {user?.role || "Stadsengagerad invånare"}
            </p>
          </div>
        </div>

        {/* Problem & Idea */}
        <div className="mt-6 space-y-4">
          {displayProblem && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-4 dark:bg-red-500/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                {t("create.what-to-improve")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {displayProblem}
              </p>
            </div>
          )}

          {displayIdea && (
            <div className="rounded-2xl border border-sage/20 bg-mint/50 p-4 dark:bg-[#292044]/50">
              <p className="text-xs font-bold uppercase tracking-wider text-sage">
                {t("create.improvement-idea")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {displayIdea}
              </p>
            </div>
          )}
        </div>

        {/* Cost */}
        {cost && Number(cost) > 0 && (
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
            <Coins size={16} className="text-sage" />
            <span>{t("create.budget")}:</span>
            <span className="text-sage">
              {new Intl.NumberFormat("sv-SE").format(Number(cost))}{" "}
              {t("create.currency")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
