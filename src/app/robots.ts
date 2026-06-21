import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://mykstars.com/sitemap.xml",
    host: "https://mykstars.com",
  };
}
