import { normalizeSearchText } from "@/lib/search-utils";

export interface LocationSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  municipality: string;
}

export const POPULAR_MUNICIPALITIES: LocationSuggestion[] = [
  { displayName: "Stockholm kommun", municipality: "Stockholm kommun", latitude: 59.3293, longitude: 18.0686 },
  { displayName: "Göteborg kommun", municipality: "Göteborg kommun", latitude: 57.7089, longitude: 11.9746 },
  { displayName: "Malmö kommun", municipality: "Malmö kommun", latitude: 55.6050, longitude: 13.0038 },
  { displayName: "Uppsala kommun", municipality: "Uppsala kommun", latitude: 59.8586, longitude: 17.6389 },
  { displayName: "Nacka kommun", municipality: "Nacka kommun", latitude: 59.3108, longitude: 18.1633 },
  { displayName: "Västerås kommun", municipality: "Västerås kommun", latitude: 59.6099, longitude: 16.5448 },
  { displayName: "Örebro kommun", municipality: "Örebro kommun", latitude: 59.2753, longitude: 15.2134 },
  { displayName: "Linköping kommun", municipality: "Linköping kommun", latitude: 58.4108, longitude: 15.6214 },
  { displayName: "Helsingborg kommun", municipality: "Helsingborg kommun", latitude: 56.0465, longitude: 12.6945 },
  { displayName: "Jönköping kommun", municipality: "Jönköping kommun", latitude: 57.7826, longitude: 14.1618 },
  { displayName: "Norrköping kommun", municipality: "Norrköping kommun", latitude: 58.5877, longitude: 16.1924 },
  { displayName: "Lund kommun", municipality: "Lund kommun", latitude: 55.7047, longitude: 13.1910 },
  { displayName: "Umeå kommun", municipality: "Umeå kommun", latitude: 63.8258, longitude: 20.2630 },
  { displayName: "Gävle kommun", municipality: "Gävle kommun", latitude: 60.6749, longitude: 17.1417 },
  { displayName: "Borås kommun", municipality: "Borås kommun", latitude: 57.7210, longitude: 12.9401 },
  { displayName: "Södertälje kommun", municipality: "Södertälje kommun", latitude: 59.1955, longitude: 17.6252 },
  { displayName: "Eskilstuna kommun", municipality: "Eskilstuna kommun", latitude: 59.3706, longitude: 16.5077 },
  { displayName: "Halmstad kommun", municipality: "Halmstad kommun", latitude: 56.6743, longitude: 12.8578 },
  { displayName: "Växjö kommun", municipality: "Växjö kommun", latitude: 56.8777, longitude: 14.8091 },
  { displayName: "Karlstad kommun", municipality: "Karlstad kommun", latitude: 59.3793, longitude: 13.5036 },
  { displayName: "Sundsvall kommun", municipality: "Sundsvall kommun", latitude: 62.3908, longitude: 17.3069 },
  { displayName: "Östersund kommun", municipality: "Östersund kommun", latitude: 63.1792, longitude: 14.6357 },
  { displayName: "Trollhättan kommun", municipality: "Trollhättan kommun", latitude: 58.2837, longitude: 12.2886 },
  { displayName: "Luleå kommun", municipality: "Luleå kommun", latitude: 65.5848, longitude: 22.1567 },
  { displayName: "Kalmar kommun", municipality: "Kalmar kommun", latitude: 56.6634, longitude: 16.3568 },
  { displayName: "Falun kommun", municipality: "Falun kommun", latitude: 60.6036, longitude: 15.6260 },
  { displayName: "Skellefteå kommun", municipality: "Skellefteå kommun", latitude: 64.7507, longitude: 20.9528 },
  { displayName: "Gotland kommun", municipality: "Gotland kommun", latitude: 57.6348, longitude: 18.2948 },
  { displayName: "Huddinge kommun", municipality: "Huddinge kommun", latitude: 59.2372, longitude: 17.9819 },
  { displayName: "Sollentuna kommun", municipality: "Sollentuna kommun", latitude: 59.4285, longitude: 17.9509 },
  { displayName: "Solna kommun", municipality: "Solna kommun", latitude: 59.3600, longitude: 18.0009 },
  { displayName: "Sundbyberg kommun", municipality: "Sundbyberg kommun", latitude: 59.3619, longitude: 17.9722 },
  { displayName: "Täby kommun", municipality: "Täby kommun", latitude: 59.4439, longitude: 18.0687 },
  { displayName: "Lidingö kommun", municipality: "Lidingö kommun", latitude: 59.3658, longitude: 18.1444 },
];

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    municipality?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

function mapMunicipality(result: NominatimResult): LocationSuggestion | null {
  const address = result.address ?? {};
  const name = address.municipality ?? address.city ?? address.town ?? address.village;
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const normalizedName = name.replace(/\s+(municipality|kommun)$/iu, "").trim().replace(/^Stockholms$/u, "Stockholm");
  const municipality = `${normalizedName} kommun`;
  return { displayName: municipality, latitude, longitude, municipality };
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 1) return [];

  // Clean query for search API
  const cleanSearchTerm = trimmedQuery.replace(/\s+(kommun|stad)$/iu, "").trim();

  const params = new URLSearchParams({
    q: `${cleanSearchTerm} kommun, Sverige`,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "se",
    limit: "8"
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Geocoding request failed with status ${response.status}`);

  const results = await response.json() as NominatimResult[];
  const normalizedQuery = normalizeSearchText(cleanSearchTerm);

  return results.flatMap(result => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!result.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    
    const normalizedDisplayName = normalizeSearchText(result.display_name);
    if (!normalizedDisplayName.includes(normalizedQuery)) return [];
    const address = result.address ?? {};
    const municipality = address.municipality ?? address.city ?? address.town ?? address.village ?? address.county ?? "";
    if (trimmedQuery.length === 1 && !normalizedDisplayName.includes("kommun")) return [];
    return [{ displayName: result.display_name, latitude, longitude, municipality }];
  });
}

export async function searchMunicipalities(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return [];

  // 1. Instant local matching against popular/predefined Swedish municipalities
  const localMatches = POPULAR_MUNICIPALITIES.filter(m => {
    const normMun = normalizeSearchText(m.municipality);
    return normMun.startsWith(normQuery) || normMun.includes(normQuery);
  });

  // If we found solid local matches and query is short, return them immediately
  const municipalities = new Map<string, LocationSuggestion>();
  localMatches.forEach(m => municipalities.set(m.displayName, m));

  try {
    const queries = normQuery === "st" ? [query, "Stockholm"] : [query];
    const resultGroups = await Promise.all(queries.map(searchTerm => searchLocations(searchTerm, signal)));
    
    resultGroups.flat().forEach(result => {
      const mapped = mapMunicipality({
        display_name: result.displayName,
        lat: String(result.latitude),
        lon: String(result.longitude),
        address: { municipality: result.municipality }
      });
      if (mapped) {
        const normMapped = normalizeSearchText(mapped.municipality);
        if (normQuery === "st" || normMapped.startsWith(normQuery) || normMapped.includes(normQuery)) {
          if (!municipalities.has(mapped.displayName)) {
            municipalities.set(mapped.displayName, mapped);
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    // If external fetch fails, return any local matches found
  }

  return [...municipalities.values()];
}

export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal): Promise<LocationSuggestion | null> {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "jsonv2",
      addressdetails: "1"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const result = (await response.json()) as NominatimResult;
    return mapMunicipality(result);
  } catch {
    return null;
  }
}



