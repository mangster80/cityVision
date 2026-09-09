import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";
  return {
    rules: { userAgent: "*", allow: ["/", "/about", "/explore", "/place/", "/proposal/"], disallow: ["/login", "/profile", "/create", "/auth/"] },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
