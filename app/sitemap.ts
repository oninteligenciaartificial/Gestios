import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gestioshq.app";
const siteUrl = appUrl.replace(/\/$/, "");

const publicRoutes = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/register",
  "/privacidad",
  "/terminos",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" || route === "/pricing" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/pricing" ? 0.9 : 0.7,
  }));
}
