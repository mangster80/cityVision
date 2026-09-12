import L from "leaflet";
import { Place } from "@/types";

export interface PlaceCluster {
  id: string;
  lat: number;
  lng: number;
  places: Place[];
  totalProposals: number;
}

export type MapItem =
  | { type: "place"; place: Place }
  | { type: "cluster"; cluster: PlaceCluster };

/**
 * Groups places into clusters based on pixel distance at the current map zoom level.
 */
export function clusterPlaces(
  map: L.Map,
  places: Place[],
  clusterRadiusPixels = 55
): MapItem[] {
  if (places.length === 0) return [];

  const zoom = map.getZoom();

  // If zoomed in close (e.g. street level zoom 14+), don't cluster unless markers are on top of each other
  const radius = zoom >= 14 ? Math.max(20, clusterRadiusPixels / 2) : clusterRadiusPixels;

  const visited = new Set<string>();
  const items: MapItem[] = [];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    if (visited.has(place.id)) continue;

    const p1Point = map.project([place.lat, place.lng], zoom);
    const clusterMembers: Place[] = [place];
    visited.add(place.id);

    for (let j = i + 1; j < places.length; j++) {
      const other = places[j];
      if (visited.has(other.id)) continue;

      const p2Point = map.project([other.lat, other.lng], zoom);
      const distance = p1Point.distanceTo(p2Point);

      if (distance <= radius) {
        clusterMembers.push(other);
        visited.add(other.id);
      }
    }

    if (clusterMembers.length === 1) {
      items.push({ type: "place", place: clusterMembers[0] });
    } else {
      // Calculate average centroid for the cluster
      const totalLat = clusterMembers.reduce((sum, p) => sum + p.lat, 0);
      const totalLng = clusterMembers.reduce((sum, p) => sum + p.lng, 0);
      const totalProposals = clusterMembers.reduce((sum, p) => sum + p.proposalCount, 0);

      items.push({
        type: "cluster",
        cluster: {
          id: `cluster-${clusterMembers.map(p => p.id).join("-")}`,
          lat: totalLat / clusterMembers.length,
          lng: totalLng / clusterMembers.length,
          places: clusterMembers,
          totalProposals,
        },
      });
    }
  }

  return items;
}
