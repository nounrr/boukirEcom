"use client"

import { Camera, Loader2, Mic, MicOff } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { toast } from "@/hooks/use-toast"
import { API_CONFIG } from "@/lib/api-config"
import { cn } from "@/lib/utils"

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

/** Photo reduced in the browser (longest side 768 px, JPEG) before it is sent: fast and light. */
async function toSmallJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas.toDataURL("image/jpeg", 0.8)
}

/**
 * Micro and camera buttons of the search field.
 * - Voice: the browser's speech recognition (Chrome, Edge, Safari); the button is hidden where it is missing.
 *   The words appear in the field while you speak; the search runs when you stop.
 * - Photo: camera or gallery; the server names the product in the photo and that name is searched.
 */
export function SearchMediaButtons({
  onInterim,
  onQuery,
  tone = "header",
}: {
  onInterim: (text: string) => void
  onQuery: (query: string) => void
  tone?: "header" | "panel"
}) {
  const locale = useLocale()
  const t = useTranslations("headerSearch")
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setVoiceSupported(Boolean(recognitionCtor())), [])
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Ctor = recognitionCtor()
    if (!Ctor) return
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
    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") toast.error(t("voiceError"))
    }
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
    } catch {
      recognitionRef.current = null
      toast.error(t("voiceError"))
    }
  }

  const searchPhoto = async (file: File) => {
    setAnalyzing(true)
    const pending = toast.loading(t("imageAnalyzing"))
    try {
      const image = await toSmallJpeg(file)
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
      onInterim(query)
      onQuery(query)
    } catch {
      toast.error(t("imageError"))
    } finally {
      toast.dismiss(pending)
      setAnalyzing(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const button = cn(
    "grid size-8 place-items-center rounded-full outline-none transition-colors disabled:opacity-60",
    tone === "panel"
      ? "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      : "text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/20"
  )

  return (
    <span className="flex items-center gap-0.5">
      {voiceSupported ? (
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={listening}
          aria-label={listening ? t("voiceStop") : t("voice")}
          title={listening ? t("voiceListening") : t("voice")}
          className={cn(button, listening && "bg-red-500/15 !text-red-500")}
        >
          {listening ? <MicOff className="size-4 animate-pulse" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={analyzing}
        aria-label={t("image")}
        title={t("image")}
        className={button}
      >
        {analyzing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void searchPhoto(file)
        }}
      />
    </span>
  )
}
