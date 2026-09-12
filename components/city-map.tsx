"use client";

import L from "leaflet";
import { Layers, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Place } from "@/types";
import { useLanguage } from "@/components/language-provider";
import { CATEGORY_CONFIGS, getCategoryConfig } from "@/lib/category-config";
import { clusterPlaces, PlaceCluster } from "@/lib/cluster-utils";

function createCategoryMarkerIcon(place: Place): L.DivIcon {
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

function createClusterIcon(cluster: PlaceCluster, labelPlaces: string): L.DivIcon {
  const count = cluster.places.length;
  const size = count >= 10 ? 46 : count >= 5 ? 42 : 38;

  return L.divIcon({
    className: "city-map-marker-container",
    html: `
      <div class="city-map-cluster" style="width: ${size}px; height: ${size}px;">
        <span class="city-map-cluster-pulse"></span>
        <div class="city-map-cluster-inner">
          <span class="city-map-cluster-count">${count}</span>
          <span class="city-map-cluster-label">${labelPlaces}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

export interface CityMapProps {
  places: Place[];
  onPlaceSelect?: (place: Place) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  focusLocation?: { lat: number; lng: number; zoom?: number; placeId?: string } | null;
  focusBounds?: [number, number][] | null;
  selectedPlaceId?: string | null;
  showLegendButton?: boolean;
  showLocateButton?: boolean;
  autoOpenPopup?: boolean;
}

export function CityMap({
  places,
  onPlaceSelect,
  center,
  zoom,
  userLocation,
  focusLocation,
  focusBounds,
  selectedPlaceId,
  showLegendButton = true,
  showLocateButton = true,
  autoOpenPopup = false,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const renderMarkersRef = useRef<() => void>(() => {});
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const { t } = useLanguage();
  onPlaceSelectRef.current = onPlaceSelect;

  const centerLat = center?.[0];
  const centerLng = center?.[1];

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersByIdRef.current.clear();

    const labelPlaces = t("citymap.places");
    const clusteredItems = clusterPlaces(map, places);

    let singleMarkerToOpen: L.Marker | null = null;

    clusteredItems.forEach(item => {
      if (item.type === "place") {
        const place = item.place;
        const config = getCategoryConfig(place.category);
        const categoryLabel = t(config.translationKey) || place.category;
        const proposalsCountLabel =
          place.proposalCount === 1
            ? t("citymap.proposal")
            : t("citymap.proposals");

        const marker = L.marker([place.lat, place.lng], {
          icon: createCategoryMarkerIcon(place),
        });

        marker.on("click", () => onPlaceSelectRef.current?.(place));
        marker.bindPopup(
          `
          <div class="city-map-popup-card">
            ${place.image ? `<div class="city-map-popup-img-wrap"><img src="${place.image}" alt="${place.name}" class="city-map-popup-img" /></div>` : ""}
            <div class="city-map-popup-body">
              <div class="city-map-popup-badge" style="color: ${config.color}; background-color: ${config.bgLight};">
                <span class="city-map-popup-icon">${config.iconSvg}</span>
                <span>${categoryLabel}</span>
              </div>
              <h3 class="city-map-popup-title">${place.name}</h3>
              <p class="city-map-popup-meta">${place.city} · ${place.proposalCount} ${proposalsCountLabel}</p>
              <a href="/place/${place.id}" class="city-map-popup-btn">
                <span>${t("citymap.view-place")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        `,
          { autoPan: false }
        );

        layer.addLayer(marker);
        markersByIdRef.current.set(place.id, marker);

        if ((autoOpenPopup && places.length === 1) || (selectedPlaceId && place.id === selectedPlaceId)) {
          singleMarkerToOpen = marker;
        }
      } else {
        const cluster = item.cluster;
        const marker = L.marker([cluster.lat, cluster.lng], {
          icon: createClusterIcon(cluster, labelPlaces),
        });

        marker.on("click", () => {
          // Smoothly zoom in to the cluster bounds
          const bounds = L.latLngBounds(cluster.places.map(p => [p.lat, p.lng]));
          map.flyToBounds(bounds.pad(0.35), { duration: 0.65, maxZoom: 15 });
        });

        layer.addLayer(marker);
      }
    });

    if (singleMarkerToOpen) {
      const targetMarker: L.Marker = singleMarkerToOpen;
      setTimeout(() => {
        if (mapRef.current) {
          targetMarker.openPopup();
        }
      }, 50);
    }
  }, [autoOpenPopup, places, selectedPlaceId, t]);

  renderMarkersRef.current = renderMarkers;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialCoords: L.LatLngExpression =
      centerLat !== undefined && centerLng !== undefined
        ? [centerLat, centerLng]
        : [59.33, 18.06];
    const initialZoomLevel = zoom ?? (centerLat !== undefined ? 15 : 5);
    const map = L.map(container).setView(initialCoords, initialZoomLevel);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "city-map-tiles"
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    markersLayerRef.current = layer;

    const onZoomOrMove = () => {
      renderMarkersRef.current();
    };

    map.on("zoomend", onZoomOrMove);
    map.on("moveend", onZoomOrMove);

    renderMarkersRef.current();

    const invalidateTimer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(invalidateTimer);
      map.off("zoomend", onZoomOrMove);
      map.off("moveend", onZoomOrMove);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
      delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    };
    // Initialize map only once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current && centerLat !== undefined && centerLng !== undefined) {
      mapRef.current.setView([centerLat, centerLng], zoom ?? 15, { animate: false });
    }
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userLocation) {
      const position: L.LatLngExpression = [userLocation[0], userLocation[1]];
      mapRef.current.flyTo(position, 13, { duration: 0.8 });
      userMarkerRef.current?.remove();
      userMarkerRef.current = L.circleMarker(position, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#e255b3",
        fillOpacity: 1
      }).addTo(mapRef.current);
      userMarkerRef.current.bindTooltip(t("citymap.you-are-here"), { direction: "top", offset: [0, -8] }).openTooltip();
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation, t]);

  useEffect(() => {
    if (!mapRef.current || !focusLocation) return;
    const targetZoom = focusLocation.zoom ?? 15;
    mapRef.current.flyTo([focusLocation.lat, focusLocation.lng], targetZoom, { duration: 0.9 });

    if (focusLocation.placeId) {
      const targetId = focusLocation.placeId;
      const popupTimer = setTimeout(() => {
        const marker = markersByIdRef.current.get(targetId);
        if (marker && mapRef.current) {
          marker.openPopup();
        }
      }, 950);
      return () => clearTimeout(popupTimer);
    }
  }, [focusLocation]);

  useEffect(() => {
    if (!mapRef.current || !focusBounds || focusBounds.length === 0) return;
    if (focusBounds.length === 1) {
      mapRef.current.flyTo(focusBounds[0], 15, { duration: 0.9 });
    } else {
      const bounds = L.latLngBounds(focusBounds.map(([lat, lng]) => [lat, lng]));
      mapRef.current.flyToBounds(bounds.pad(0.2), { duration: 0.9, maxZoom: 15 });
    }
  }, [focusBounds]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

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
        userMarkerRef.current.bindTooltip(t("citymap.you-are-here"), { direction: "top", offset: [0, -8] }).openTooltip();
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

    {/* Category legend toggle */}
    {showLegendButton && (
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col items-start gap-1.5">
        {showLegend && (
          <div className="flex max-w-[260px] flex-wrap gap-1.5 rounded-2xl border border-black/10 bg-white/95 p-2.5 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-[#201b35]/95 sm:max-w-xs">
            <p className="mb-0.5 w-full text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("citymap.legend")}
            </p>
            {Object.values(CATEGORY_CONFIGS).map(cat => (
              <span
                key={cat.key}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: cat.bgLight, color: cat.color }}
              >
                <span
                  className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5"
                  dangerouslySetInnerHTML={{ __html: cat.iconSvg }}
                />
                <span>{t(cat.translationKey) || cat.key}</span>
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowLegend(prev => !prev)}
          className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-ink shadow-md backdrop-blur-sm transition hover:bg-white dark:border-white/15 dark:bg-[#201b35]/90 dark:text-white dark:hover:bg-[#201b35]"
          aria-expanded={showLegend}
          title={t("citymap.legend")}
        >
          <Layers size={14} className="text-[#7056d8]" />
          <span>{t("citymap.legend")}</span>
        </button>
      </div>
    )}

    {showLocateButton && (
      <button
        type="button"
        onClick={locateUser}
        disabled={locating}
        aria-label={t("citymap.show-my-location")}
        title={t("citymap.show-my-location")}
        className="absolute right-3 top-3 z-[400] grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white text-ink shadow-lg transition hover:bg-mint disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-[#201b35] dark:text-white dark:hover:bg-[#292044]"
      >
        <LocateFixed size={18} className={locating ? "animate-pulse" : ""} />
      </button>
    )}
    {locationError && <p role="status" className="absolute bottom-3 right-3 z-[400] max-w-xs rounded-xl bg-ink/90 px-3 py-2 text-xs text-white shadow-lg">{t("citymap.could-not-find-your-location-check-browser-location-permissi")}</p>}
  </div>;
}


