/**
 * Catalogue photos go through Next's image optimizer (`/_next/image`): resized to the width
 * actually shown, converted to WebP, and cached on the server, instead of downloading the
 * original upload (often a 1–2 MB PNG) for a 150 px card.
 */

/** Widths Next accepts by default (imageSizes + deviceSizes). */
const WIDTHS = [64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920] as const

function hostOf(src: string): string | null {
  try {
    return new URL(src).hostname
  } catch {
    return null
  }
}

/**
 * True when Next can optimize this image: a site path or an http(s) URL, not an SVG, not a
 * data/blob URL, and not a local address (the optimizer refuses those, as in local development).
 */
export function canOptimize(src?: string | null): boolean {
  const value = String(src ?? "").trim()
  if (!value) return false
  if (/^(data|blob):/i.test(value)) return false
  if (/\.svg(\?|#|$)/i.test(value)) return false
  if (value.startsWith("/")) return !value.startsWith("//")
  if (!/^https?:\/\//i.test(value)) return false
  const host = hostOf(value)
  if (!host) return false
  return !(host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost"))
}

function nearestWidth(width: number): number {
  return WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1]
}

/** URL of the optimized image at (at least) `width` px wide, or the original when it cannot be optimized. */
export function optimizedImageSrc(src: string, width: number, quality = 75): string {
  if (!canOptimize(src)) return src
  return `/_next/image?url=${encodeURIComponent(src)}&w=${nearestWidth(width)}&q=${quality}`
}

/**
 * `src` + `srcSet` for a plain <img> shown at about `displayWidth` CSS px: 1x and 2x (sharp on
 * phones' dense screens) versions, so the browser picks the lightest one that stays crisp.
 */
export function optimizedImageProps(src: string, displayWidth: number, quality = 75) {
  if (!canOptimize(src)) return { src }
  const one = nearestWidth(displayWidth)
  const two = nearestWidth(displayWidth * 2)
  return {
    src: optimizedImageSrc(src, one, quality),
    srcSet: one === two ? undefined : `${optimizedImageSrc(src, one, quality)} 1x, ${optimizedImageSrc(src, two, quality)} 2x`,
  }
}
