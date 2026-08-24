import type { MetadataRoute } from "next";

const baseUrl = "https://cardrive.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
