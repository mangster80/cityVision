export interface LocationSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  municipality: string;
}

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

  const params = new URLSearchParams({
    q: `${trimmedQuery} kommun, Sverige`,
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
  return results.flatMap(result => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!result.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const normalizedQuery = trimmedQuery.toLocaleLowerCase("sv-SE");
    const normalizedDisplayName = result.display_name.toLocaleLowerCase("sv-SE");
    if (!normalizedDisplayName.includes(normalizedQuery)) return [];
    const address = result.address ?? {};
    const municipality = address.municipality ?? address.city ?? address.town ?? address.village ?? address.county ?? "";
    if (trimmedQuery.length === 1 && !normalizedDisplayName.includes("kommun")) return [];
    return [{ displayName: result.display_name, latitude, longitude, municipality }];
  });
}

export async function searchMunicipalities(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim().toLocaleLowerCase("sv-SE");
  const queries = trimmedQuery === "st" ? [query, "Stockholm"] : [query];
  const resultGroups = await Promise.all(queries.map(searchTerm => searchLocations(searchTerm, signal)));
  const municipalities = new Map<string, LocationSuggestion>();
  resultGroups.flat().forEach(result => {
    const municipality = mapMunicipality({
      display_name: result.displayName,
      lat: String(result.latitude),
      lon: String(result.longitude),
      address: { municipality: result.municipality }
    });
    const normalizedMunicipality = municipality?.municipality.toLocaleLowerCase("sv-SE") ?? "";
    if (municipality && (trimmedQuery === "st" || normalizedMunicipality.startsWith(trimmedQuery))) {
      municipalities.set(municipality.displayName, municipality);
    }
  });
  return [...municipalities.values()];
}
