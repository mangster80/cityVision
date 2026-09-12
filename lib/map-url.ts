/**
 * Generates an appropriate map deep link based on user device/OS:
 * - iOS / iPadOS / macOS / Safari on Apple devices: Apple Maps (`https://maps.apple.com/?q=...&ll=lat,lng`)
 * - Android: Google Maps intent / universal link (`geo:lat,lng?q=...` or `https://www.google.com/maps/search/?api=1&query=...`)
 * - Fallback / Desktop / Other: Google Maps web link
 */
export function getMapUrl(lat: number, lng: number, label?: string): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    const encodedLabel = label ? encodeURIComponent(label) : "";
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${encodedLabel ? `&query_place_id=${encodedLabel}` : ""}`;
  }

  const userAgent = navigator.userAgent || "";
  const platform = (navigator as unknown as { userAgentData?: { platform?: string }; platform?: string }).platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isMac = /Macintosh|Mac OS X/.test(userAgent) && !isIOS;
  const isAndroid = /Android/i.test(userAgent);

  const encodedLabel = label ? encodeURIComponent(label) : "";

  if (isIOS) {
    // Apple Maps URL scheme for iOS
    return encodedLabel
      ? `https://maps.apple.com/?q=${encodedLabel}&ll=${lat},${lng}`
      : `https://maps.apple.com/?ll=${lat},${lng}&q=${lat},${lng}`;
  }

  if (isMac) {
    // Apple Maps URL scheme for macOS
    return encodedLabel
      ? `https://maps.apple.com/?q=${encodedLabel}&ll=${lat},${lng}`
      : `https://maps.apple.com/?ll=${lat},${lng}&q=${lat},${lng}`;
  }

  if (isAndroid) {
    // Android Google Maps URL (geo: or standard https query for universal link support)
    return encodedLabel
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}+(${encodedLabel})`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  // Default / Desktop / Windows / Linux
  return encodedLabel
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}+(${encodedLabel})`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
