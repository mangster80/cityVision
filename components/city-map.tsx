"use client";

import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types";
import { useLanguage } from "@/components/language-provider";

const markerIcon = L.divIcon({
  className: "city-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export function CityMap({ places, onPlaceSelect }: { places: Place[]; onPlaceSelect?: (place: Place) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const { t } = useLanguage();
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView([59.33, 18.06], 5);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "city-map-tiles"
    }).addTo(map);

    places.forEach(place => {
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon }).addTo(map);
      marker.on("click", () => onPlaceSelectRef.current?.(place));
      marker.bindPopup(`
        <div class="space-y-1">
          <p class="font-semibold">${place.name}</p>
          <p class="text-xs text-slate-500">${place.city} · ${place.proposalCount} förslag</p>
          <a href="/place/${place.id}" class="text-xs font-semibold text-[#7056d8]">Visa plats</a>
        </div>
      `);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    };
  }, [places]);

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current) {
      setLocationError(true);
      return;
    }

    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: L.LatLngExpression = [coords.latitude, coords.longitude];
        mapRef.current?.setView(position, 13, { animate: true });
        userMarkerRef.current?.remove();
        userMarkerRef.current = L.circleMarker(position, {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#e255b3",
          fillOpacity: 1
        }).addTo(mapRef.current!);
        userMarkerRef.current.bindTooltip(t("Du är här", "You are here"), { direction: "top", offset: [0, -8] }).openTooltip();
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return <div className="city-map-shell relative z-0 h-full w-full">
    <div ref={containerRef} className="h-full w-full" />
    <button type="button" onClick={locateUser} disabled={locating} aria-label={t("Visa min position", "Show my location")} title={t("Visa min position", "Show my location")} className="absolute right-3 top-3 z-[400] grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white text-ink shadow-lg transition hover:bg-mint disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-[#201b35] dark:text-white dark:hover:bg-[#292044]">
      <LocateFixed size={18} className={locating ? "animate-pulse" : ""} />
    </button>
    {locationError && <p role="status" className="absolute bottom-3 left-3 right-3 z-[400] rounded-xl bg-ink/90 px-3 py-2 text-xs text-white shadow-lg">{t("Kunde inte hitta din position. Kontrollera webbläsarens platsåtkomst.", "Could not find your location. Check browser location permissions.")}</p>}
  </div>;
}
