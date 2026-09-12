"use client";

import L from "leaflet";
import { ExternalLink, MapPin, Navigation, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types";
import { useLanguage } from "@/components/language-provider";
import { getCategoryConfig } from "@/lib/category-config";
import { getMapUrl } from "@/lib/map-url";

interface PlaceMapProps {
  place: Place;
}

function createPlaceMarkerIcon(place: Place): L.DivIcon {
  const config = getCategoryConfig(place.category);
  const badgeHtml =
    place.proposalCount > 0
      ? `<span class="city-map-pin-badge">${place.proposalCount}</span>`
      : "";

  return L.divIcon({
    className: "city-map-marker-container",
    html: `
      <div class="city-map-pin" style="--pin-color: ${config.color};">
        <div class="city-map-pin-body">
          <span class="city-map-pin-icon">${config.iconSvg}</span>
        </div>
        <div class="city-map-pin-point"></div>
        ${badgeHtml}
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
}

export function PlaceMap({ place }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { t } = useLanguage();
  const config = getCategoryConfig(place.category);
  const categoryLabel = t(config.translationKey) || place.category;

  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([place.lat, place.lng], 15, { animate: true });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    }).setView([place.lat, place.lng], 15);

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "city-map-tiles",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    const marker = L.marker([place.lat, place.lng], {
      icon: createPlaceMarkerIcon(place),
    }).addTo(map);

    marker.bindPopup(
      `
      <div class="p-1 text-left">
        <div class="text-[10px] font-bold uppercase tracking-wider text-sage">${categoryLabel}</div>
        <div class="text-xs font-semibold text-ink dark:text-white">${place.name}</div>
        <div class="text-[10px] text-slate-400">${place.city}</div>
      </div>
      `,
      { closeButton: false, offset: [0, -10], autoPan: false }
    );

    const timer = setTimeout(() => {
      if (mapRef.current) {
        map.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    };
  }, [place.lat, place.lng, place.name, place.city, categoryLabel]);

  const [mapUrl, setMapUrl] = useState(() =>
    getMapUrl(place.lat, place.lng, `${place.name}, ${place.city}`)
  );

  useEffect(() => {
    setMapUrl(getMapUrl(place.lat, place.lng, `${place.name}, ${place.city}`));
  }, [place.lat, place.lng, place.name, place.city]);

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#201b35]">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-sage" />
          <span className="text-xs font-bold uppercase tracking-[.14em] text-sage">
            {t("place.location-and-surroundings")}
          </span>
        </div>
        <button
          type="button"
          onClick={resetView}
          title={t("place.recenter-map")}
          aria-label={t("place.recenter-map")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
        >
          <RotateCcw size={13} />
          <span>{t("place.recenter-map")}</span>
        </button>
      </div>

      <div className="city-map-shell relative h-64 w-full">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-ink dark:text-white">{place.name}</p>
          <p className="text-xs text-slate-400">
            {place.city} · {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
          </p>
        </div>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sage hover:bg-mint hover:text-sage dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-[#292044]"
        >
          <Navigation size={12} />
          <span>{t("proposal.open-in-maps")}</span>
          <ExternalLink size={10} className="opacity-60" />
        </a>
      </div>
    </div>
  );
}
