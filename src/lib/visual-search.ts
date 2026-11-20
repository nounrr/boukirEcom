import { API_CONFIG } from "@/lib/api-config"
import type { ProductListItem, ProductsListResponse } from "@/types/api/products"

/** An object seen in the photo: box [ymin, xmin, ymax, xmax] in 0-1000, its name and the text read on it. */
export type LensObject = { box: [number, number, number, number]; label: string; text: string }

/**
 * Products that look like the photo (Gemini Embedding 2 on the server), most similar first,
 * optionally with words (« le même en rouge »). [] when visual search is unavailable.
 */
export async function visualMatches(image: string, text = ""): Promise<ProductListItem[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/search/visual`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, limit: 24, ...(text.trim() ? { text: text.trim() } : {}) }),
  })
  if (!res.ok) return []
  const data = (await res.json().catch(() => null)) as { results?: { id: number }[] } | null
  const ids = (data?.results ?? []).map((r) => Number(r.id)).filter((id) => Number.isSafeInteger(id) && id > 0)
  if (ids.length === 0) return []
  const list = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products?ids=${ids.join(",")}&per_page=${ids.length}&in_stock_only=false`, {
    headers: { Platform: "web" },
  })
  if (!list.ok) return []
  const body = (await list.json().catch(() => null)) as ProductsListResponse | null
  return body?.products ?? []
}

/** The products seen in the photo, with their boxes (Lens). [] when unavailable. */
export async function lensObjects(image: string): Promise<LensObject[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/search/lens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  })
  if (!res.ok) return []
  const data = (await res.json().catch(() => null)) as { objects?: LensObject[] } | null
  return (data?.objects ?? []).filter((o) => Array.isArray(o.box) && o.box.length === 4)
}

/** Part of a photo (box in 0-1000, a little margin around it) as a JPEG data URL. */
export async function cropImage(dataUrl: string, box: [number, number, number, number]): Promise<string> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const pad = 30
  const [ymin, xmin, ymax, xmax] = [Math.max(0, box[0] - pad), Math.max(0, box[1] - pad), Math.min(1000, box[2] + pad), Math.min(1000, box[3] + pad)]
  const sx = (xmin / 1000) * img.naturalWidth
  const sy = (ymin / 1000) * img.naturalHeight
  const sw = Math.max(1, ((xmax - xmin) / 1000) * img.naturalWidth)
  const sh = Math.max(1, ((ymax - ymin) / 1000) * img.naturalHeight)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(sw)
  canvas.height = Math.round(sh)
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.85)
}
