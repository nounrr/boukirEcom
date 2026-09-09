import type { AppLocale } from "@/i18n/locale"

function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "")
  return host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
    host === "[::1]" || host === "[::]" || host === "0.0.0.0" ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
}

/** One origin for canonical URLs, alternates, sitemaps and structured data. */
export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const production = process.env.NODE_ENV === "production"
  const fail = () => new Error(
    "NEXT_PUBLIC_SITE_URL must be an absolute site origin (https://boukirdiamond.com in production), " +
    "without credentials, path, query or fragment. Production requires HTTPS and a public host.",
  )

  if (!raw) {
    if (production) throw fail()
    return new URL("http://localhost:3002")
  }

  let url: URL
  try { url = new URL(raw) } catch { throw fail() }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) throw fail()
  if (production && (url.protocol !== "https:" || isLocalHost(url.hostname) ||
      !url.hostname.includes("."))) throw fail()

  return new URL(url.origin)
}

export function localePrefix(locale: AppLocale): string {
  return `/${locale}`
}

/** Match Next's default trailingSlash:false, including the localized home page. */
export function localizedPath(locale: AppLocale, path: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//") || path.includes("\\")) {
    throw new Error("SEO page paths must be application paths, not absolute URLs.")
  }
  const suffixIndex = path.search(/[?#]/)
  const pathname = suffixIndex < 0 ? path : path.slice(0, suffixIndex)
  const suffix = suffixIndex < 0 ? "" : path.slice(suffixIndex)
  const segments = pathname.split("/").filter(Boolean)
  // Accept an already-localized input without doubling its language prefix.
  while (segments.length && /^(fr|ar|en|zh)$/.test(segments[0])) segments.shift()
  return `${localePrefix(locale)}${segments.length ? `/${segments.join("/")}` : ""}${suffix}`
}

export function localizedUrl(locale: AppLocale, path: string): string {
  return new URL(localizedPath(locale, path), getSiteUrl()).toString()
}

/** Keep valid HTTPS CDN images, resolve site assets, repair legacy local uploads. */
export function seoImageUrl(imageUrl?: string | null): string | null {
  const raw = imageUrl?.trim()
  if (!raw || raw === "null" || raw === "undefined") return null
  const site = getSiteUrl()
  let url: URL
  try { url = new URL(raw, site) } catch { return null }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null

  const sameSite = url.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")
  if (sameSite || isLocalHost(url.hostname)) {
    url = new URL(`${url.pathname}${url.search}${url.hash}`, site)
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null
  return url.toString()
}
