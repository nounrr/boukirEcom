"use client"

import { Camera, ClipboardPaste, ImageUp, Loader2, Mic, MicOff, Search, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { API_CONFIG } from "@/lib/api-config"
import { cn } from "@/lib/utils"
import { optimizedImageProps } from "@/lib/image-optimize"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import type { ProductListItem, ProductsListResponse } from "@/types/api/products"
import Link from "next/link"

/* Web Speech API: not in the TypeScript DOM library, so the few members used here. */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

const SPEECH_LANG: Record<string, string> = { fr: "fr-FR", ar: "ar-MA", en: "en-US", zh: "zh-CN" }

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Name of a getUserMedia / speech error, to pick the message shown. */
function errorName(error: unknown) {
  return error && typeof error === "object" && "name" in error ? String((error as { name: unknown }).name) : ""
}

/** Picture reduced in the browser (longest side 768 px, JPEG) before it is sent: fast and light. */
async function toSmallJpeg(source: Blob | HTMLVideoElement): Promise<string> {
  let width: number
  let height: number
  let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  let release = () => {}
  if (source instanceof Blob) {
    const bitmap = await createImageBitmap(source)
    width = bitmap.width
    height = bitmap.height
    draw = (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h)
    release = () => bitmap.close?.()
  } else {
    width = source.videoWidth
    height = source.videoHeight
    draw = (ctx, w, h) => ctx.drawImage(source, 0, 0, w, h)
  }
  const scale = Math.min(1, 768 / Math.max(width, height, 1))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  draw(ctx, canvas.width, canvas.height)
  release()
  return canvas.toDataURL("image/jpeg", 0.8)
}

/** Products that look like the photo (visual search), most similar first; [] when unavailable. */
async function visualMatches(image: string): Promise<ProductListItem[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/search/visual`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image, limit: 24 }),
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

/** First image of a paste or a drop, if any. */
function imageFrom(data: DataTransfer | null): File | null {
  if (!data) return null
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile()
  }
  return Array.from(data.files ?? []).find((file) => file.type.startsWith("image/")) ?? null
}

/**
 * Micro and camera buttons of the search field.
 * - Voice: the browser asks for the micro, then its speech recognition writes the words in the field
 *   and the search runs when you stop. Hidden where the browser has no speech recognition (Firefox).
 * - Photo: a window to take a picture with the camera, paste an image (Ctrl+V), drop one or choose a file.
 *   An image pasted or dropped straight on the search field works too.
 *   The server names the product in the picture and that name is searched.
 */
export function SearchMediaButtons({
  onInterim,
  onQuery,
  tone = "header",
  image = true,
}: {
  onInterim: (text: string) => void
  onQuery: (query: string) => void
  tone?: "header" | "panel"
  /** Photo search (the server names the product in the picture). Off for non-product fields. */
  image?: boolean
}) {
  const locale = useLocale()
  const t = useTranslations("headerSearch")
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [similar, setSimilar] = useState<{ image: string; products: ProductListItem[] } | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => setVoiceSupported(Boolean(recognitionCtor())), [])
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const voiceError = useCallback(
    (name: string) => {
      if (name === "no-speech" || name === "aborted" || name === "AbortError") return
      if (name === "not-allowed" || name === "service-not-allowed" || name === "NotAllowedError" || name === "SecurityError") toast.error(t("voiceBlocked"))
      else if (name === "audio-capture" || name === "NotFoundError" || name === "NotReadableError") toast.error(t("voiceNoMic"))
      else if (name === "network") toast.error(t("voiceNetwork"))
      else toast.error(t("voiceError"))
    },
    [t]
  )

  const startVoice = async () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Ctor = recognitionCtor()
    if (!Ctor) return
    // Ask for the micro first: the browser shows its permission popup here, and a refusal gets a clear message.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        voiceError(errorName(error))
        return
      }
    }
    const recognition = new Ctor()
    recognition.lang = SPEECH_LANG[locale] ?? "fr-FR"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    let finalText = ""
    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interim += result[0].transcript
      }
      onInterim((finalText + interim).trim())
    }
    recognition.onerror = (event) => voiceError(event.error)
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
      const text = finalText.trim()
      if (text) onQuery(text)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      toast.info(t("voiceListening"), { duration: 2500 })
    } catch {
      recognitionRef.current = null
      toast.error(t("voiceError"))
    }
  }

  // Old path: the server names the product in the photo, and that name is searched as text.
  const searchByName = useCallback(
    async (image: string) => {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/search/image`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image, locale }),
      })
      const data = (await res.json().catch(() => null)) as { query?: string; message?: string } | null
      if (!res.ok) throw new Error(data?.message || "image search")
      const query = String(data?.query || "").trim()
      if (!query) {
        toast.error(t("imageNothing"))
        return
      }
      setSimilar(null)
      setPhotoOpen(false)
      onInterim(query)
      onQuery(query)
    },
    [locale, onInterim, onQuery, t]
  )

  // Visual search first (products that look like the photo, Gemini Embedding 2); when it is not
  // available (no key yet, index being built, error) or finds nothing, the name search above.
  const searchPhoto = useCallback(
    async (source: Blob | HTMLVideoElement) => {
      setAnalyzing(true)
      const pending = toast.loading(t("imageAnalyzing"))
      try {
        const image = await toSmallJpeg(source)
        const products = await visualMatches(image).catch(() => [])
        if (products.length > 0) {
          setSimilar({ image, products })
          setPhotoOpen(true)
          return
        }
        await searchByName(image)
      } catch {
        toast.error(t("imageError"))
      } finally {
        toast.dismiss(pending)
        setAnalyzing(false)
      }
    },
    [searchByName, t]
  )

  const searchSimilarByName = useCallback(
    async (image: string) => {
      setAnalyzing(true)
      try {
        await searchByName(image)
      } catch {
        toast.error(t("imageError"))
      } finally {
        setAnalyzing(false)
      }
    },
    [searchByName, t]
  )

  // Paste (Ctrl+V) or drop an image straight on the search field.
  useEffect(() => {
    const field = anchorRef.current?.parentElement?.parentElement
    if (!field || !image) return
    const onPaste = (event: ClipboardEvent) => {
      const file = imageFrom(event.clipboardData)
      if (!file) return
      event.preventDefault()
      void searchPhoto(file)
    }
    const onDragOver = (event: DragEvent) => {
      if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) event.preventDefault()
    }
    const onDrop = (event: DragEvent) => {
      const file = imageFrom(event.dataTransfer)
      if (!file) return
      event.preventDefault()
      void searchPhoto(file)
    }
    field.addEventListener("paste", onPaste)
    field.addEventListener("dragover", onDragOver)
    field.addEventListener("drop", onDrop)
    return () => {
      field.removeEventListener("paste", onPaste)
      field.removeEventListener("dragover", onDragOver)
      field.removeEventListener("drop", onDrop)
    }
  }, [searchPhoto, image])

  const button = cn(
    "grid size-8 place-items-center rounded-full outline-none transition-colors disabled:opacity-60",
    tone === "panel"
      ? "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      : "text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/20"
  )

  return (
    <span ref={anchorRef} className="flex items-center gap-0.5">
      {voiceSupported ? (
        <button
          type="button"
          onClick={() => void startVoice()}
          aria-pressed={listening}
          aria-label={listening ? t("voiceStop") : t("voice")}
          title={listening ? t("voiceListening") : t("voice")}
          className={cn(button, listening && "bg-red-500/15 !text-red-500")}
        >
          {listening ? <MicOff className="size-4 animate-pulse" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
      {image ? (
        <>
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            disabled={analyzing}
            aria-label={t("image")}
            title={t("image")}
            className={button}
          >
            {analyzing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
          </button>
          <PhotoSearchDialog
            open={photoOpen}
            onOpenChange={(open) => {
              setPhotoOpen(open)
              if (!open) setSimilar(null)
            }}
            analyzing={analyzing}
            onPicture={searchPhoto}
            similar={similar}
            onByName={(image) => void searchSimilarByName(image)}
            onNewPhoto={() => setSimilar(null)}
          />
        </>
      ) : null}
    </span>
  )
}

/** Window of the photo search: live camera, paste, drop or file. */
function PhotoSearchDialog({
  open,
  onOpenChange,
  analyzing,
  onPicture,
  similar,
  onByName,
  onNewPhoto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  analyzing: boolean
  onPicture: (source: Blob | HTMLVideoElement) => Promise<void>
  similar: { image: string; products: ProductListItem[] } | null
  onByName: (image: string) => void
  onNewPhoto: () => void
}) {
  const t = useTranslations("headerSearch")
  const locale = useLocale()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [camera, setCamera] = useState<"off" | "starting" | "on">("off")
  const [dragging, setDragging] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCamera("off")
  }, [])

  // Camera off when the window closes.
  useEffect(() => {
    if (!open) stopCamera()
  }, [open, stopCamera])
  useEffect(() => stopCamera, [stopCamera])

  // Ctrl+V anywhere while the window is open.
  useEffect(() => {
    if (!open) return
    const onPaste = (event: ClipboardEvent) => {
      const file = imageFrom(event.clipboardData)
      if (!file) return
      event.preventDefault()
      void onPicture(file)
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [open, onPicture])

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click()
      return
    }
    setCamera("starting")
    try {
      // The browser shows its permission popup here; back camera on phones.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        void video.play().catch(() => {})
      }
      setCamera("on")
    } catch (error) {
      setCamera("off")
      const name = errorName(error)
      toast.error(name === "NotAllowedError" || name === "SecurityError" ? t("cameraBlocked") : t("cameraError"))
    }
  }

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    await onPicture(video)
  }

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const type = item.types.find((value) => value.startsWith("image/"))
        if (type) {
          await onPicture(await item.getType(type))
          return
        }
      }
      toast.error(t("pasteEmpty"))
    } catch {
      toast.info(t("pasteHint"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          {similar ? (
            // eslint-disable-next-line @next/next/no-img-element -- the customer's own photo (data URL)
            <img src={similar.image} alt="" className="size-14 shrink-0 rounded-xl border border-border object-cover" />
          ) : null}
          <div className="min-w-0">
            <DialogTitle className="text-lg font-extrabold">{similar ? t("similarTitle") : t("imageTitle")}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">{similar ? t("similarDesc") : t("imageDesc")}</DialogDescription>
          </div>
        </div>

        {similar ? (
          <>
            <ul className="grid max-h-[55vh] grid-cols-2 gap-2.5 overflow-y-auto pe-1 sm:grid-cols-3">
              {similar.products.map((product) => {
                const src = toAbsoluteImageUrl(product.image_url)
                const name = getLocalizedProductName(product as never, locale) || product.designation
                const price = Number(product.prix_promo || product.prix_vente) || 0
                return (
                  <li key={product.id}>
                    <Link
                      href={productHref(product, locale)}
                      onClick={() => onOpenChange(false)}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-[0_14px_30px_-22px_rgba(13,13,13,0.6)]"
                    >
                      <span className="grid aspect-square place-items-center bg-white">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element -- catalogue photos served by the API
                          <img {...optimizedImageProps(src, 160)} alt="" loading="lazy" decoding="async" className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                        ) : null}
                      </span>
                      <span className="flex flex-1 flex-col gap-1 p-2.5">
                        <span className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-accent-text">{name}</span>
                        {price > 0 ? (
                          <span className="mt-auto text-sm font-extrabold tabular-nums">
                            {price.toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                            <span className="text-[10px] font-bold text-accent-text">MAD</span>
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onByName(similar.image)}
                disabled={analyzing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/50 disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
                {t("byName")}
              </button>
              <button
                type="button"
                onClick={onNewPhoto}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
              >
                <Camera className="size-4" aria-hidden="true" />
                {t("newPhoto")}
              </button>
            </div>
          </>
        ) : (
        <>

        <div
          className={cn(
            "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/40 transition-colors",
            dragging ? "border-primary bg-primary/10" : "border-border"
          )}
          onDragOver={(event) => {
            if (!Array.from(event.dataTransfer.types).includes("Files")) return
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            setDragging(false)
            const file = imageFrom(event.dataTransfer)
            if (!file) return
            event.preventDefault()
            void onPicture(file)
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn("absolute inset-0 size-full object-cover", camera === "on" ? "block" : "hidden")}
          />
          {camera === "on" ? (
            <>
              <button
                type="button"
                onClick={stopCamera}
                aria-label={t("cameraStop")}
                className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/75"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void capture()}
                disabled={analyzing}
                aria-label={t("cameraCapture")}
                className="absolute bottom-3 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-white/30 backdrop-blur-sm transition-transform hover:scale-105 disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="size-6 animate-spin text-white" aria-hidden="true" /> : <span className="size-10 rounded-full bg-white" />}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              {analyzing || camera === "starting" ? (
                <Loader2 className="size-8 animate-spin text-accent-text" aria-hidden="true" />
              ) : (
                <ImageUp className="size-8 text-accent-text" aria-hidden="true" />
              )}
              <p className="text-sm font-semibold">{t("imageDrop")}</p>
              <p className="text-xs text-muted-foreground">{t("pasteHint")}</p>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void (camera === "on" ? capture() : startCamera())}
            disabled={analyzing || camera === "starting"}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold px-4 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            <Camera className="size-4" aria-hidden="true" />
            {camera === "on" ? t("cameraCapture") : t("cameraOpen")}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={analyzing}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            <ImageUp className="size-4" aria-hidden="true" />
            {t("imageChoose")}
          </button>
          <button
            type="button"
            onClick={() => void pasteFromClipboard()}
            disabled={analyzing}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            <ClipboardPaste className="size-4" aria-hidden="true" />
            {t("imagePaste")}
          </button>
        </div>

        </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (file) void onPicture(file)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
