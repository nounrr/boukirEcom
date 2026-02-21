import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/seo/metadata"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",

          "/checkout",
          "/cart",
          "/orders",
          "/profile",
          "/wishlist",
          "/login",
          "/register",
          "/forgot-password",

          "/fr/checkout",
          "/fr/cart",
          "/fr/orders",
          "/fr/profile",
          "/fr/wishlist",
          "/fr/login",
          "/fr/register",
          "/fr/forgot-password",

          "/ar/checkout",
          "/ar/cart",
          "/ar/orders",
          "/ar/profile",
          "/ar/wishlist",
          "/ar/login",
          "/ar/register",
          "/ar/forgot-password",

          "/en/checkout",
          "/en/cart",
          "/en/orders",
          "/en/profile",
          "/en/wishlist",
          "/en/login",
          "/en/register",
          "/en/forgot-password",

          "/zh/checkout",
          "/zh/cart",
          "/zh/orders",
          "/zh/profile",
          "/zh/wishlist",
          "/zh/login",
          "/zh/register",
          "/zh/forgot-password",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  }
}
