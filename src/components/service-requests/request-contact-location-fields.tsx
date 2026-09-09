"use client"

import dynamic from 'next/dynamic'
import { ChevronDown, Loader2, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LocationPicker = dynamic(() => import('@/components/shop/checkout/location-picker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl border bg-muted/30" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
    </div>
  ),
})

export interface RequestContactLocationValue {
  contactName: string
  contactPhone: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
}

interface Props {
  value: RequestContactLocationValue
  onChange: (value: RequestContactLocationValue) => void
  errors?: Partial<Record<'contactPhone' | 'city' | 'address', string>>
  addressRequired?: boolean
  idPrefix?: string
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="text-sm text-destructive">{message}</p> : null
}

export function RequestContactLocationFields({
  value,
  onChange,
  errors = {},
  addressRequired = false,
  idPrefix = 'service-request',
}: Props) {
  const t = useTranslations('serviceRequests')
  const [mapOpen, setMapOpen] = useState(false)
  const update = (patch: Partial<RequestContactLocationValue>) => onChange({ ...value, ...patch })
  const phoneErrorId = `${idPrefix}-contact-phone-error`
  const cityErrorId = `${idPrefix}-city-error`
  const addressErrorId = `${idPrefix}-address-error`

  return (
    <fieldset className="space-y-4">
      <legend className="mb-5 flex items-center gap-3 text-lg font-semibold text-foreground"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><MapPin className="h-5 w-5" aria-hidden="true" /></span>{t('fields.contactLegend')}</legend>
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-contact-name`}>{t('fields.contactName')} <span className="text-xs font-normal text-muted-foreground">({t('fields.optional')})</span></Label>
          <Input
            id={`${idPrefix}-contact-name`}
            value={value.contactName}
            onChange={(event) => update({ contactName: event.target.value })}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-contact-phone`}>{t('fields.phone')} <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-contact-phone`}
            value={value.contactPhone}
            onChange={(event) => update({ contactPhone: event.target.value })}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(errors.contactPhone)}
            aria-describedby={errors.contactPhone ? phoneErrorId : undefined}
            required
          />
          <FieldError id={phoneErrorId} message={errors.contactPhone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-city`}>{t('fields.city')} <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(event) => update({ city: event.target.value })}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? cityErrorId : undefined}
            required
          />
          <FieldError id={cityErrorId} message={errors.city} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-address`}>
            {t('fields.address')} {addressRequired ? <span className="text-destructive">*</span> : <span className="text-xs font-normal text-muted-foreground">({t('fields.optional')})</span>}
          </Label>
          <Input
            id={`${idPrefix}-address`}
            value={value.address}
            onChange={(event) => update({ address: event.target.value })}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? addressErrorId : undefined}
            required={addressRequired}
          />
          <FieldError id={addressErrorId} message={errors.address} />
        </div>
      </div>

      <Collapsible open={mapOpen} onOpenChange={setMapOpen} className="overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="h-auto min-h-12 w-full justify-between gap-3 whitespace-normal rounded-xl px-4 py-4 text-start hover:bg-transparent hover:text-emerald-700 dark:hover:text-emerald-400">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {value.latitude != null ? t('map.positionSaved') : t('map.open')}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mapOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t p-4">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t('map.hint')}</p>
          <LocationPicker
            className="h-[320px] sm:h-[390px]"
            initialLat={value.latitude ?? undefined}
            initialLng={value.longitude ?? undefined}
            labels={{ searchPlaceholder: t('map.search'), releaseToConfirm: t('map.release'), currentPosition: t('map.current') }}
            onLocationSelect={(location) => update({
              latitude: location.lat,
              longitude: location.lng,
              address: location.address || value.address,
              city: location.city || value.city,
            })}
          />
          {value.latitude != null && value.longitude != null && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{t('map.coordinates', { latitude: value.latitude.toFixed(5), longitude: value.longitude.toFixed(5) })}</span>
              <button type="button" className="min-h-11 font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => update({ latitude: null, longitude: null })}>
                {t('map.remove')}
              </button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </fieldset>
  )
}
