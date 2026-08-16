"use client"

import { Camera, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { SERVICE_REQUEST_LIMITS, SERVICE_REQUEST_PHOTO_TYPES } from '@/lib/service-request-validation'

interface Props {
  photos: File[]
  onChange: (photos: File[]) => void
  onError: (message: string) => void
  id?: string
}

export function RequestPhotoField({ photos, onChange, onError, id = 'quick-photos' }: Props) {
  const t = useTranslations('serviceRequests')
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview)), [previews])

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files)
    if (photos.length + selected.length > SERVICE_REQUEST_LIMITS.photos) {
      onError(t('validation.tooManyPhotos'))
      return
    }
    if (selected.some((file) => !SERVICE_REQUEST_PHOTO_TYPES.has(file.type) || file.size > SERVICE_REQUEST_LIMITS.photoBytes)) {
      onError(t('validation.photoInvalid'))
      return
    }
    onError('')
    onChange([...photos, ...selected])
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{t('uploads.field')}</Label>
      <label htmlFor={id} className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 py-5 text-center transition hover:border-primary/60 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-primary">
        <Camera className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium">{t('uploads.action')}</span>
        <span className="mt-1 text-xs text-muted-foreground">{t('uploads.hint')}</span>
      </label>
      <input id={id} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
        addPhotos(event.target.files)
        event.target.value = ''
      }} />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div className="group relative aspect-square overflow-hidden rounded-lg border" key={`${photo.name}-${photo.lastModified}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[index]} alt={t('uploads.previewAlt', { index: index + 1 })} className="h-full w-full object-cover" />
              <button type="button" aria-label={t('uploads.remove', { name: photo.name })} className="absolute end-1 top-1 rounded-full bg-black/75 p-1.5 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" onClick={() => onChange(photos.filter((_, photoIndex) => photoIndex !== index))}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
