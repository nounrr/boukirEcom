"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Layers, Loader2, MapPin, Navigation, Search } from "lucide-react"
import { useLocale } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { LocationPickerProps } from "./location-picker"

/* The few Maps JavaScript API pieces used here (no @types package needed). */
type LatLngLiteral = { lat: number; lng: number }
type GLatLng = { lat: () => number; lng: () => number }
type AddressComponent = { long_name?: string; longText?: string; types?: string[] }
type GeocoderResult = { formatted_address: string; address_components: AddressComponent[]; geometry: { location: GLatLng } }
type GMap = {
  getCenter: () => GLatLng | undefined
  panTo: (p: LatLngLiteral | GLatLng) => void
  setZoom: (z: number) => void
  setMapTypeId: (id: string) => void
  addListener: (event: string, fn: () => void) => void
}
type PlacePrediction = { text: { toString: () => string }; toPlace: () => { location?: GLatLng; fetchFields: (o: { fields: string[] }) => Promise<unknown> } }
type Google = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap
    Geocoder: new () => {
      geocode: (req: Record<string, unknown>, cb: (res: GeocoderResult[] | null, status: string) => void) => void
    }
    places?: {
      AutocompleteSessionToken: new () => unknown
      AutocompleteSuggestion?: {
        fetchAutocompleteSuggestions: (req: Record<string, unknown>) => Promise<{ suggestions?: { placePrediction?: PlacePrediction }[] }>
      }
    }
  }
}

export const GOOGLE_MAPS_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim()

let loading: Promise<Google> | null = null
let authFailed = false
const authListeners = new Set<() => void>()

/** Loads the Maps JavaScript API once (places + geocoding). Google reports a refused key via gm_authFailure. */
function loadGoogleMaps(language: string): Promise<Google> {
  const w = window as unknown as { google?: Google; __boukirMapsInit?: () => void; gm_authFailure?: () => void }
  if (w.google?.maps?.Map) return Promise.resolve(w.google)
  if (loading) return loading
  w.gm_authFailure = () => {
    authFailed = true
    authListeners.forEach((fn) => fn())
  }
  loading = new Promise<Google>((resolve, reject) => {
    w.__boukirMapsInit = () => (w.google ? resolve(w.google) : reject(new Error("google maps")))
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly&libraries=places,geocoding&language=${language}&region=MA&loading=async&callback=__boukirMapsInit`
    script.async = true
    script.onerror = () => {
      loading = null
      reject(new Error("google maps"))
    }
    document.head.appendChild(script)
  })
  return loading
}

/** Street + district, city and postcode: the same reading as the OpenStreetMap picker and the app. */
function readAddress(result: GeocoderResult) {
  const get = (type: string) => {
    const c = result.address_components.find((part) => (part.types ?? []).includes(type))
    return c?.long_name || c?.longText || ""
  }
  const street = [get("street_number"), get("route")].filter(Boolean).join(" ")
  const district = get("neighborhood") || get("sublocality_level_1") || get("sublocality")
  const line = [street, district].filter(Boolean).join(", ") || get("premise") || get("point_of_interest") || result.formatted_address.split(",")[0]
  const city = get("locality") || get("postal_town") || get("administrative_area_level_2") || get("administrative_area_level_1")
  return { line, city, postalCode: get("postal_code"), label: result.formatted_address }
}

type Suggestion = { id: string; label: string; go: () => void }

/**
 * Checkout map on Google Maps: move the map under the pin (the address under it fills the form), search with Google's
 * suggestions, or use the device's position. Calls onFail when Google refuses the key, so the checkout falls back to
 * OpenStreetMap instead of showing a broken map.
 */
export default function GoogleLocationPicker({ onLocationSelect, initialLat, initialLng, className, labels, onFail }: LocationPickerProps & { onFail: () => void }) {
  const locale = useLocale()
  const language = locale === "zh" ? "zh-CN" : locale
  const box = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GMap | null>(null)
  const googleRef = useRef<Google | null>(null)
  const tokenRef = useRef<unknown>(null)
  const lastKey = useRef("")
  const select = useRef(onLocationSelect)
  const fail = useRef(onFail)
  useEffect(() => {
    select.current = onLocationSelect
    fail.current = onFail
  })

  const [ready, setReady] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [satellite, setSatellite] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const goTo = useCallback((p: LatLngLiteral | GLatLng, zoom = 17) => {
    mapRef.current?.panTo(p)
    mapRef.current?.setZoom(zoom)
  }, [])

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLoadingLocation(true)
    const ok = (pos: GeolocationPosition) => {
      goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setIsLoadingLocation(false)
    }
    navigator.geolocation.getCurrentPosition(ok, () => navigator.geolocation.getCurrentPosition(ok, () => setIsLoadingLocation(false), { enableHighAccuracy: false, timeout: 10000 }), {
      enableHighAccuracy: true,
      timeout: 5000,
    })
  }, [goTo])

  // Map, then the address under the pin each time the map stops.
  useEffect(() => {
    let alive = true
    const onAuth = () => alive && fail.current()
    authListeners.add(onAuth)
    if (authFailed) fail.current()
    const hasStart = initialLat !== undefined && initialLng !== undefined
    loadGoogleMaps(language)
      .then((google) => {
        if (!alive || !box.current) return
        googleRef.current = google
        const map = new google.maps.Map(box.current, {
          center: hasStart ? { lat: initialLat, lng: initialLng } : { lat: 33.5731, lng: -7.5898 },
          zoom: hasStart ? 16 : 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        })
        mapRef.current = map
        const geocoder = new google.maps.Geocoder()
        map.addListener("dragstart", () => setIsMoving(true))
        map.addListener("idle", () => {
          setIsMoving(false)
          const c = map.getCenter()
          if (!c) return
          const lat = c.lat()
          const lng = c.lng()
          const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
          if (key === lastKey.current) return
          lastKey.current = key
          geocoder.geocode({ location: { lat, lng }, language }, (res, status) => {
            if (!alive || key !== lastKey.current) return
            if (status === "REQUEST_DENIED") return fail.current()
            const best = status === "OK" && res?.[0]
            if (!best) return
            const place = readAddress(best)
            setSearchQuery(place.label)
            select.current({ lat, lng, address: place.line, city: place.city, postalCode: place.postalCode })
          })
        })
        setReady(true)
        if (!hasStart) locateMe()
      })
      .catch(() => alive && fail.current())
    return () => {
      alive = false
      authListeners.delete(onAuth)
    }
    // The map is built once; later moves go through goTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close suggestions on a click outside.
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  // Google suggestions while typing (Places), else the Geocoder.
  useEffect(() => {
    const q = searchQuery.trim()
    if (!showSuggestions || q.length < 3 || !ready) return
    let alive = true
    const timer = window.setTimeout(async () => {
      const google = googleRef.current
      const map = mapRef.current
      if (!google || !map) return
      setIsSearching(true)
      const center = map.getCenter()
      const near = center ? { lat: center.lat(), lng: center.lng() } : { lat: 33.5731, lng: -7.5898 }
      const viaGeocoder = () =>
        new Promise<Suggestion[]>((resolve) => {
          new google.maps.Geocoder().geocode({ address: q, componentRestrictions: { country: "MA" }, language }, (res, status) =>
            resolve((status === "OK" && res ? res : []).slice(0, 5).map((r, i) => ({ id: `g${i}`, label: r.formatted_address, go: () => goTo(r.geometry.location) }))),
          )
        })
      let items: Suggestion[] = []
      try {
        const places = google.maps.places
        if (places?.AutocompleteSuggestion) {
          if (!tokenRef.current) tokenRef.current = new places.AutocompleteSessionToken()
          const r = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            sessionToken: tokenRef.current,
            includedRegionCodes: ["ma"],
            language,
            locationBias: { center: near, radius: 30000 },
          })
          items = (r.suggestions ?? [])
            .map((s) => s.placePrediction)
            .filter((p): p is PlacePrediction => Boolean(p))
            .slice(0, 5)
            .map((p, i) => ({
              id: `p${i}`,
              label: p.text.toString(),
              go: () => {
                const place = p.toPlace()
                place
                  .fetchFields({ fields: ["location"] })
                  .then(() => {
                    tokenRef.current = null
                    if (place.location) goTo(place.location)
                  })
                  .catch(() => {})
              },
            }))
        }
        if (items.length === 0) items = await viaGeocoder()
      } catch {
        items = await viaGeocoder()
      }
      if (alive) {
        setSuggestions(items)
        setIsSearching(false)
      }
    }, 400)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [searchQuery, showSuggestions, ready, language, goTo])

  return (
    <div className={cn("group relative z-0 h-[500px] w-full overflow-hidden rounded-xl border border-border bg-muted/10 shadow-sm", className)} ref={wrapperRef}>
      <div ref={box} className="h-full w-full" />

      {!ready ? (
        <div className="absolute inset-0 grid place-items-center bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : null}

      {/* Search */}
      <div className="absolute left-3 right-3 top-3 z-500 sm:left-4 sm:right-auto sm:top-4 sm:w-full sm:max-w-md">
        <div className="relative rounded-lg shadow-md">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (searchQuery.length > 2) setShowSuggestions(true)
            }}
            placeholder={labels?.searchPlaceholder || "Chercher votre adresse..."}
            Icon={Search}
            className="h-10 rounded-md bg-transparent text-sm shadow-none [&>div>input]:bg-white"
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : null}
          {showSuggestions && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-lg border border-border/50 bg-background/95 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-muted/50"
                  onClick={() => {
                    setShowSuggestions(false)
                    setSuggestions([])
                    s.go()
                  }}
                >
                  <div className="mt-0.5 shrink-0 rounded-full bg-muted p-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="line-clamp-2 font-medium text-foreground/90">{s.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Plan / satellite */}
      {ready ? (
        <button
          type="button"
          onClick={() => {
            const next = !satellite
            setSatellite(next)
            mapRef.current?.setMapTypeId(next ? "hybrid" : "roadmap")
          }}
          className="absolute right-3 top-16 z-500 inline-flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-background/90 px-3 text-xs font-semibold shadow-lg backdrop-blur sm:top-4"
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          {satellite ? "Plan" : "Satellite"}
        </button>
      ) : null}

      {/* Pin: its tip is the map's centre */}
      <div className="pointer-events-none absolute inset-0 z-400 flex items-center justify-center pb-8">
        <div className={`relative transition-transform duration-200 ease-out ${isMoving ? "-translate-y-3 scale-110" : "translate-y-0"}`}>
          <div className="relative z-10">
            <MapPin className="h-10 w-10 fill-primary text-primary drop-shadow-xl" strokeWidth={1.5} />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner" />
          </div>
          <div className={`absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-[100%] bg-black/20 blur-[2px] transition-all duration-200 ${isMoving ? "scale-75 opacity-40" : "scale-100 opacity-100"}`} />
        </div>
        {isMoving ? (
          <div className="absolute top-1/2 mt-8 rounded-full bg-black/75 px-2 py-1 text-[10px] font-medium text-white shadow-lg backdrop-blur animate-in fade-in zoom-in-95">
            {labels?.releaseToConfirm || "Relâcher pour valider"}
          </div>
        ) : null}
      </div>

      {/* Device position */}
      <div className="absolute bottom-6 left-1/2 z-400 flex -translate-x-1/2 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={locateMe}
          disabled={isLoadingLocation || !ready}
          className="h-10 gap-2 rounded-full border border-border/50 bg-background/90 px-5 shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-background active:scale-95"
        >
          {isLoadingLocation ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Navigation className="h-4 w-4 fill-primary/20 text-primary" />}
          <span className="text-sm font-medium">{labels?.currentPosition || "Ma position actuelle"}</span>
        </Button>
      </div>
    </div>
  )
}
