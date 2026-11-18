"use client"

import { Bot, Loader2, Mic, RotateCcw, Send, Trash2, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FormEvent, useCallback, useEffect, useRef, useState } from "react"

import { API_CONFIG } from "@/lib/api-config"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"

/** Dispatch this event anywhere (e.g. the SmartFab menu) to open the assistant. */
export const OPEN_ASSISTANT_EVENT = "boukir:open-assistant"

export function openShopAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { prompt } }))
}

type ChatProduct = {
  id: number
  name: string
  price: number | null
  promo_price: number | null
  promo_percent: number | null
  brand: string | null
  in_stock: boolean
  image_url: string | null
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  products?: ChatProduct[]
  error?: boolean
}

const STORAGE_KEY = "boukir-assistant-v1"
const MAX_INPUT = 1000
const MAX_VOICE_SECONDS = 60
const VOICE_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"]

/** First audio format this browser can record (Chrome/Firefox: webm, Safari/iPhone: mp4), or null. */
function pickVoiceType(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return null
  return VOICE_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

function formatSeconds(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(-30) : []
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
  } catch {
    /* private mode / quota: the chat still works for this page */
  }
}

function formatPrice(value: number | null, locale: string) {
  if (value == null) return ""
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale, { maximumFractionDigits: 2 }).format(value)} DH`
}

/**
 * Shop assistant (OpenAI, via POST /api/ecommerce/chat).
 * The conversation stays in this browser tab (sessionStorage); the server keeps nothing.
 * Products found by the assistant are shown as cards linking to their page.
 */
export function ShopAssistant() {
  const t = useTranslations("xp.assistant")
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pendingPrompt = useRef<string | null>(null)

  // Voice message: record → server transcribes (OpenAI) → the text is sent like a typed message.
  const [voiceType, setVoiceType] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const discardRef = useRef(false)

  useEffect(() => setVoiceType(pickVoiceType()), [])

  useEffect(() => setMessages(loadHistory()), [])
  useEffect(() => saveHistory(messages), [messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading, open])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, MAX_INPUT)
      if (!content || loading) return
      setVoiceError(null)
      const next: ChatMessage[] = [...messages.filter((m) => !m.error), { role: "user", content }]
      setMessages(next)
      setInput("")
      setLoading(true)
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: next.slice(-20).map(({ role, content }) => ({ role, content })),
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(res.status === 429 ? t("errorBusy") : t("error"))
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(data.reply || ""), products: Array.isArray(data.products) ? data.products : [] },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: error instanceof Error && error.message ? error.message : t("error"), error: true },
        ])
      } finally {
        setLoading(false)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }
    },
    [loading, locale, messages, t]
  )

  const releaseMic = useCallback(() => {
    if (timerRef.current != null) window.clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    setRecording(false)
  }, [])

  const transcribe = useCallback(
    async (blob: Blob) => {
      setTranscribing(true)
      try {
        const form = new FormData()
        const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"
        form.append("audio", blob, `vocal.${ext}`)
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/chat/transcribe`, { method: "POST", body: form })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(res.status === 429 ? t("errorBusy") : t("voiceError"))
        const text = String(data.text || "").trim()
        if (!text) throw new Error(t("voiceEmpty"))
        await send(text)
      } catch (error) {
        setVoiceError(error instanceof Error && error.message ? error.message : t("voiceError"))
      } finally {
        setTranscribing(false)
      }
    },
    [send, t]
  )

  const startRecording = useCallback(async () => {
    if (voiceType == null || recording || transcribing || loading) return
    setVoiceError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = voiceType ? new MediaRecorder(stream, { mimeType: voiceType }) : new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      discardRef.current = false
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || voiceType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        releaseMic()
        if (!discardRef.current && blob.size > 1000) void transcribe(blob)
      }
      recorder.start()
      setSeconds(0)
      setRecording(true)
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= MAX_VOICE_SECONDS && recorderRef.current?.state === "recording") recorderRef.current.stop()
          return value + 1
        })
      }, 1000)
    } catch {
      releaseMic()
      setVoiceError(t("voiceDenied"))
    }
  }, [loading, recording, releaseMic, transcribe, transcribing, t, voiceType])

  const stopRecording = useCallback((discard: boolean) => {
    discardRef.current = discard
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }, [])

  // Closing the panel or leaving the page never leaves the microphone on.
  useEffect(() => {
    if (!open && recorderRef.current) stopRecording(true)
  }, [open, stopRecording])
  useEffect(() => () => {
    discardRef.current = true
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true)
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt
      if (prompt) pendingPrompt.current = prompt
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (open && pendingPrompt.current && !loading) {
      const prompt = pendingPrompt.current
      pendingPrompt.current = null
      void send(prompt)
    }
  }, [open, loading, send])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  if (!open) return null

  const isCheckout = /\/(checkout)(\/|$)/.test(pathname)
  const suggestions = [t("suggest1"), t("suggest2"), t("suggest3")]

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  return (
    <section
      role="dialog"
      aria-label={t("title")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] flex h-[min(85dvh,640px)] flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-background text-foreground shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]",
        "sm:inset-x-auto sm:bottom-24 sm:end-6 sm:h-[min(75vh,620px)] sm:w-[400px] sm:rounded-3xl",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        isCheckout && "sm:bottom-6"
      )}
    >
      <header className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-orange text-ink">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="truncate text-xs text-white/60">{t("subtitle")}</p>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => setMessages([])}
            aria-label={t("reset")}
            title={t("reset")}
            className="grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="rounded-2xl rounded-ss-sm bg-muted px-3.5 py-2.5 text-sm">{t("welcome")}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-brand-orange/40 px-3 py-1.5 text-xs font-medium hover:bg-brand-orange/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user" ? "rounded-se-sm bg-ink text-white" : "rounded-ss-sm bg-muted",
                m.error && "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              )}
            >
              {m.content}
            </p>
            {m.products && m.products.length > 0 ? (
              <ul className="w-full space-y-2">
                {m.products.map((p) => {
                  const img = toAbsoluteImageUrl(p.image_url)
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/${locale}/product/${p.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-black/10 bg-card p-2 transition-colors hover:border-brand-orange/60 dark:border-white/10"
                      >
                        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="size-full object-contain" loading="lazy" />
                          ) : (
                            <Bot className="size-5 text-muted-foreground" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-xs font-medium">{p.name}</span>
                          <span className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
                            <span className="font-semibold text-brand-orange">
                              {formatPrice(p.promo_price ?? p.price, locale)}
                            </span>
                            {p.promo_price != null ? (
                              <span className="text-muted-foreground line-through">{formatPrice(p.price, locale)}</span>
                            ) : null}
                            {!p.in_stock ? <span className="text-muted-foreground">{t("outOfStock")}</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        ))}

        {loading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("thinking")}
          </p>
        ) : null}
      </div>

      {voiceError ? (
        <p role="alert" className="border-t border-black/10 px-4 pt-2 text-xs text-red-600 dark:border-white/10 dark:text-red-400">
          {voiceError}
        </p>
      ) : null}
      {recording || transcribing ? (
        <div className="flex items-center gap-2 border-t border-black/10 p-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => stopRecording(true)}
            disabled={transcribing}
            aria-label={t("voiceCancel")}
            title={t("voiceCancel")}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </button>
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl bg-muted px-3.5 text-sm" aria-live="polite">
            {transcribing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("voiceTranscribing")}
              </>
            ) : (
              <>
                <span className="size-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                <span className="font-medium tabular-nums">{formatSeconds(seconds)}</span>
                <span className="truncate text-muted-foreground">{t("voiceRecording")}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => stopRecording(false)}
            disabled={transcribing}
            aria-label={t("voiceSend")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-orange text-ink disabled:opacity-40"
          >
            <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
      ) : (
      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          rows={1}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-black/15 bg-background px-3.5 py-2.5 text-base outline-none focus:border-brand-orange sm:text-sm dark:border-white/15"
        />
        {!input.trim() && voiceType != null ? (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={loading}
            aria-label={t("voiceStart")}
            title={t("voiceStart")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-orange text-ink transition-opacity disabled:opacity-40"
          >
            <Mic className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t("send")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-orange text-ink transition-opacity disabled:opacity-40"
          >
            <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        )}
      </form>
      )}
      <p className="px-4 pb-2 text-center text-[10px] text-muted-foreground">{t("disclaimer")}</p>
    </section>
  )
}
