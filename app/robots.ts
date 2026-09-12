import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/explore", "/place/", "/proposal", "/proposal/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/collaborator-invite/",
          "/create",
          "/login",
          "/profile",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
