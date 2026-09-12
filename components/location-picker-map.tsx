"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { getCategoryConfig } from "@/lib/category-config";
import {
  LocationSuggestion,
  searchLocations,
} from "@/services/geocoding-service";

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  category?: string;
  placeName?: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export function LocationPickerMap({
  latitude,
  longitude,
  category,
  placeName,
  onLocationChange,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { t } = useLanguage();

  const [currentCoords, setCurrentCoords] = useState<[number, number]>(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      return [latitude, longitude];
    }
    return [59.3293, 18.0686]; // Default Stockholm
  });

  const [hasUserPlacedPin, setHasUserPlacedPin] = useState(
    Boolean(latitude && longitude)
  );

  const categoryConfig = getCategoryConfig(category);

  // Initialize Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
    }).setView(currentCoords, hasUserPlacedPin ? 15 : 12);

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "city-map-tiles",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const updateMarker = (lat: number, lng: number) => {
      const icon = L.divIcon({
        className: "city-map-marker-container",
        html: `
          <div class="city-map-pin" style="--pin-color: ${categoryConfig.color};">
            <div class="city-map-pin-body">
              <span class="city-map-pin-icon">${categoryConfig.iconSvg}</span>
            </div>
            <div class="city-map-pin-point"></div>
          </div>
        `,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
        popupAnchor: [0, -38],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(icon);
      } else {
        const marker = L.marker([lat, lng], {
          icon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setCurrentCoords([pos.lat, pos.lng]);
          setHasUserPlacedPin(true);
          onLocationChange(pos.lat, pos.lng);
        });

        markerRef.current = marker;
      }
    };

    if (hasUserPlacedPin) {
      updateMarker(currentCoords[0], currentCoords[1]);
    }

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setCurrentCoords([lat, lng]);
      setHasUserPlacedPin(true);
      updateMarker(lat, lng);
      onLocationChange(lat, lng);
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    };
  }, []);

  // Update marker icon if category changes
  useEffect(() => {
    if (markerRef.current && hasUserPlacedPin) {
      const icon = L.divIcon({
        className: "city-map-marker-container",
        html: `
          <div class="city-map-pin" style="--pin-color: ${categoryConfig.color};">
            <div class="city-map-pin-body">
              <span class="city-map-pin-icon">${categoryConfig.iconSvg}</span>
            </div>
            <div class="city-map-pin-point"></div>
          </div>
        `,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
        popupAnchor: [0, -38],
      });
      markerRef.current.setIcon(icon);
    }
  }, [category, categoryConfig]);

  // Sync external coords
  useEffect(() => {
    if (
      latitude &&
      longitude &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      (latitude !== currentCoords[0] || longitude !== currentCoords[1])
    ) {
      setCurrentCoords([latitude, longitude]);
      setHasUserPlacedPin(true);
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 15, { animate: true });
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          const icon = L.divIcon({
            className: "city-map-marker-container",
            html: `
              <div class="city-map-pin" style="--pin-color: ${categoryConfig.color};">
                <div class="city-map-pin-body">
                  <span class="city-map-pin-icon">${categoryConfig.iconSvg}</span>
                </div>
                <div class="city-map-pin-point"></div>
              </div>
            `,
            iconSize: [32, 38],
            iconAnchor: [16, 38],
            popupAnchor: [0, -38],
          });
          const marker = L.marker([latitude, longitude], {
            icon,
            draggable: true,
          }).addTo(mapRef.current);

          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            setCurrentCoords([pos.lat, pos.lng]);
            setHasUserPlacedPin(true);
            onLocationChange(pos.lat, pos.lng);
          });
          markerRef.current = marker;
        }
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-slate-100 dark:border-white/10 dark:bg-[#1a162b]">
      <div ref={containerRef} className="h-64 w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="rounded-xl bg-ink/80 px-3 py-1.5 text-xs font-medium text-white shadow backdrop-blur dark:bg-black/80">
          {hasUserPlacedPin
            ? `${t("create.location-selected")} ${currentCoords[0].toFixed(4)}, ${currentCoords[1].toFixed(4)}`
            : t("create.click-map-to-place-pin")}
        </div>
      </div>
    </div>
  );
}
