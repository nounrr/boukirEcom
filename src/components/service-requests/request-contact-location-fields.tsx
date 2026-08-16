"use client"

import dynamic from 'next/dynamic'
import { ChevronDown, Loader2, MapPin, Phone, UserRound } from 'lucide-react'
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
      <legend className="text-lg font-semibold text-foreground">{t('fields.contactLegend')}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-contact-name`}>{t('fields.contactName')} <span className="text-xs font-normal text-muted-foreground">({t('fields.optional')})</span></Label>
          <Input
            id={`${idPrefix}-contact-name`}
            value={value.contactName}
            onChange={(event) => update({ contactName: event.target.value })}
            autoComplete="name"
            Icon={UserRound}
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
            Icon={Phone}
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
            Icon={MapPin}
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
            Icon={MapPin}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? addressErrorId : undefined}
            required={addressRequired}
          />
          <FieldError id={addressErrorId} message={errors.address} />
        </div>
      </div>

      <Collapsible open={mapOpen} onOpenChange={setMapOpen} className="rounded-xl border bg-muted/20">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-start">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {value.latitude != null ? t('map.positionSaved') : t('map.open')}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mapOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t p-3">
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
              <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => update({ latitude: null, longitude: null })}>
                {t('map.remove')}
              </button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </fieldset>
  )
}
