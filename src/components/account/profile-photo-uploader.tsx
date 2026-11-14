"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, Loader2, UserCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useUploadProfileAvatarMutation } from "@/state/api/auth-api-slice"
import { useAppDispatch, useAppSelector, useAppStore } from "@/state/hooks"
import { setUser } from "@/state/slices/user-slice"
import { API_CONFIG } from "@/lib/api-config"
import { toast } from "@/hooks/use-toast"

export function ProfilePhotoUploader() {
  const t = useTranslations("profile.photo")
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const user = useAppSelector(state => state.user.user)
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [upload, { isLoading }] = useUploadProfileAvatarMutation()

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function selectPhoto(file?: File) {
    if (!file || !user || isLoading) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("invalidType")); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("tooLarge")); return
    }
    const token = store.getState().user.accessToken
    setPreview(URL.createObjectURL(file))
    try {
      const saved = await upload(file).unwrap()
      const current = store.getState().user
      if (!current.isAuthenticated || current.accessToken !== token || current.user?.id !== saved.id) return
      dispatch(setUser({ ...current.user, ...saved }))
      toast.success(t("success"))
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message
      toast.error(message || t("error"))
    } finally {
      setPreview(null)
      if (input.current) input.current.value = ""
    }
  }

  const image = preview || (user?.avatar_url
    ? user.avatar_url.startsWith("http") ? user.avatar_url : `${API_CONFIG.BASE_URL}${user.avatar_url}`
    : null)

  return (
    <section aria-label={t("title")} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
        {image ? <img src={image} alt={t("title")} className="size-full object-cover" referrerPolicy="no-referrer" />
          : <UserCircle2 className="size-10 text-muted-foreground" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
        <input ref={input} id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp"
          aria-label={t("choose")} className="sr-only" disabled={isLoading || !user}
          onChange={event => { void selectPhoto(event.target.files?.[0]) }} />
        <Button type="button" variant="outline" size="sm" disabled={isLoading || !user}
          onClick={() => input.current?.click()} className="gap-2">
          {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
          {isLoading ? t("saving") : t("choose")}
        </Button>
      </div>
    </section>
  )
}
