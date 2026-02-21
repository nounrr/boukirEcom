"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Loader2, Navigation, Check } from "lucide-react"

// Interface for address results
interface AddressResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
}

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number
    lng: number
    address: string
    city: string
    postalCode: string
  }) => void
  initialLat?: number
  initialLng?: number
}

// Controller to handle map movement events and expose center
function MapController({ 
    onMoveStart, 
    onMoveEnd, 
    initialLat, 
    initialLng 
}: { 
    onMoveStart: () => void; 
    onMoveEnd: (center: L.LatLng) => void;
    initialLat?: number;
    initialLng?: number;
}) {
  const map = useMap()
  const hasInitialized = useRef(false)

  // Handle initial flyTo only once
  useEffect(() => {
    if (!hasInitialized.current && initialLat && initialLng) {
        map.setView([initialLat, initialLng], 16, { animate: false })
        hasInitialized.current = true
    }
  }, [initialLat, initialLng, map])

  useMapEvents({
    dragstart: () => onMoveStart(),
    movestart: () => onMoveStart(),
    moveend: () => onMoveEnd(map.getCenter()),
    zoomstart: () => onMoveStart(),
  })
  return null
}

export default function LocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  // Default to Casablanca
  const defaultLat = 33.5731
  const defaultLng = -7.5898
  
  // Internal state for map center (independent of selected location until confirmed/stopped)
  // We use the initial props only for the very first render position
  const startLat = initialLat ?? defaultLat
  const startLng = initialLng ?? defaultLng

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AddressResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Map State
  const [isMoving, setIsMoving] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  const reverseAbortRef = useRef<AbortController | null>(null)
  const reverseReqIdRef = useRef(0)
  const moveEndTimerRef = useRef<number | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // Suggestion visibility
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      reverseAbortRef.current?.abort()
      searchAbortRef.current?.abort()
      if (moveEndTimerRef.current) window.clearTimeout(moveEndTimerRef.current)
    }
  }, [])

  // Reverse Geocoding Function
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    reverseAbortRef.current?.abort()
    const controller = new AbortController()
    reverseAbortRef.current = controller
    const reqId = ++reverseReqIdRef.current

    try {
      const response = await fetch(`/api/nominatim/reverse?lat=${lat}&lng=${lng}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed (${response.status})`)
      }

      const data: AddressResult = await response.json()

      // Ignore stale responses.
      if (reverseReqIdRef.current !== reqId) return

      const addr = data.address
      // Prioritize road/neighborhood for the main address field
      // Logic: Street > Neighborhood > City > Display Name
      const street = addr.road || addr.suburb || data.display_name.split(",")[0]
      const city = addr.city || addr.town || addr.village || addr.state || ""
      const postalCode = addr.postcode || ""

      setSearchQuery(data.display_name) // Update search bar for visual feedback
      
      onLocationSelect({
        lat,
        lng,
        address: data.display_name,
        city,
        postalCode,
      })
    } catch (error: any) {
      if (error?.name === "AbortError") return
      if (process.env.NODE_ENV !== "production") {
        console.warn("Reverse geocoding failed:", error)
      }
    }
  }, [onLocationSelect])

  // Handle map movement end
  const handleMapMoveEnd = useCallback((center: L.LatLng) => {
    setIsMoving(false)

    // Debounce to reduce request bursts.
    if (moveEndTimerRef.current) window.clearTimeout(moveEndTimerRef.current)
    moveEndTimerRef.current = window.setTimeout(() => {
      fetchAddress(center.lat, center.lng)
    }, 350)
  }, [fetchAddress])

  const handleLocateMe = () => {
    setIsLoadingLocation(true)
    if (!navigator.geolocation) {
        setIsLoadingLocation(false)
        return
    }

    const onSuccess = (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords
        mapRef.current?.flyTo([latitude, longitude], 17, {
            duration: 1.5 // Smooth fly animation
        })
        setIsLoadingLocation(false)
    }

    const onError = (err: GeolocationPositionError) => {
        console.error("Geolocation error (high accuracy):", err)
        // Fallback
        navigator.geolocation.getCurrentPosition(
            onSuccess,
            () => setIsLoadingLocation(false),
            { enableHighAccuracy: false, timeout: 10000 }
        )
    }

    navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  // Initial auto-locate only if no initial coords provided
  useEffect(() => {
    if (initialLat === undefined && initialLng === undefined) {
        handleLocateMe()
    }
  }, []) // Run once on mount

  // Debounced search logic...
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 3 || isMoving) { 
        // Don't search while moving or if query is short
        return
      }
      
      // If the query matches the current selected address exactly (likely programmatic update), skip search
      // This is a heuristic to prevent search popup from opening when dragging map results in address update
      // We can refine this by tracking "user typed" status but this is simple

      // We only search if the user is TYPING. 
      // How do we distinguish typing from "setSearchQuery" in fetchAddress? 
      // We'll rely on Focus/showSuggestions logic primarily.
      
      if (!showSuggestions) return 

      setIsSearching(true)
      try {
        searchAbortRef.current?.abort()
        const controller = new AbortController()
        searchAbortRef.current = controller

        const center = mapRef.current?.getCenter()
        const lat = center?.lat ?? startLat
        const lng = center?.lng ?? startLng

        const response = await fetch(
          `/api/nominatim/search?q=${encodeURIComponent(searchQuery)}&countrycodes=ma&addressdetails=1&limit=5&lat=${lat}&lng=${lng}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          throw new Error(`Search failed (${response.status})`)
        }
        const data = await response.json()
        setSearchResults(data)
      } catch (error: any) {
        if (error?.name === "AbortError") return
        if (process.env.NODE_ENV !== "production") {
          console.warn("Search failed:", error)
        }
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, showSuggestions, isMoving, startLat, startLng])


  const handleSearchResultClick = (result: AddressResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    // Close suggestions
    setShowSuggestions(false)
    setSearchResults([])
    
    // Fly to location - this will trigger handleMapMoveEnd -> fetchAddress -> update props
    mapRef.current?.flyTo([lat, lng], 17)
  }

  return (
    <div className="w-full relative z-0 h-[500px] rounded-xl overflow-hidden border border-border shadow-sm bg-muted/10 group" ref={wrapperRef}>
        
        {/* Top Search Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-500 sm:top-4 sm:left-4 sm:right-auto sm:w-full sm:max-w-md">
            <div className="relative shadow-md rounded-lg">
                <Input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowSuggestions(true) // User is typing, show suggestions
                    }}
                    onFocus={() => {
                        if (searchQuery.length > 2) setShowSuggestions(true)
                    }}
                    placeholder="Chercher votre adresse..."
                    Icon={Search}
            className="h-10 text-sm shadow-none rounded-md bg-transparent [&>div>input]:bg-white"
                />
                
                {/* Search Loading Spinner */}
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                )}
                
                {/* Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {searchResults.map((result, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 text-sm border-b border-border/50 last:border-0 transition-colors flex items-start gap-3"
                        onClick={() => handleSearchResultClick(result)}
                    >
                        <div className="mt-0.5 bg-muted rounded-full p-1.5 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="line-clamp-2 text-foreground/90 font-medium">{result.display_name}</span>
                    </button>
                    ))}
                </div>
                )}
            </div>
      </div>

        {/* The Map */}
        <MapContainer
          ref={mapRef}
          center={[startLat, startLng]}
          zoom={15}
          zoomControl={false}
          className="h-full w-full outline-none"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            onMoveStart={() => setIsMoving(true)}
            onMoveEnd={handleMapMoveEnd}
            initialLat={initialLat}
            initialLng={initialLng}
          />
          
          <ZoomControl position="bottomright" />
        </MapContainer>

        {/* Center Pin Overlay (Uber Style) */}
      <div className="absolute inset-0 pointer-events-none z-400 flex items-center justify-center pb-8 /* Offset for pin tip */">
            <div className={`relative transition-transform duration-200 ease-out ${isMoving ? '-translate-y-3 scale-110' : 'translate-y-0'}`}>
                {/* Pin Head */}
                <div className="relative z-10">
                    <MapPin className="w-10 h-10 text-primary fill-primary drop-shadow-xl" strokeWidth={1.5} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-inner" />
                </div>
                {/* Pin Shadow */}
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 rounded-[100%] blur-[2px] transition-all duration-200 ${isMoving ? 'opacity-40 scale-75' : 'opacity-100 scale-100'}`} />
            </div>
            
            {/* Context Tooltip near pin when moving */}
            {isMoving && (
                <div className="absolute top-1/2 mt-8 bg-black/75 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full font-medium shadow-lg animate-in fade-in zoom-in-95">
                    Relâcher pour valider
                </div>
            )}
        </div>

        {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-400">
            <Button
                type="button"
                variant="secondary"
                onClick={handleLocateMe}
                disabled={isLoadingLocation}
                className="shadow-lg bg-background/90 backdrop-blur hover:bg-background h-10 gap-2 px-5 rounded-full border border-border/50 transition-all hover:scale-105 active:scale-95"
            >
                {isLoadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                    <Navigation className="w-4 h-4 text-primary fill-primary/20" />
                )}
                <span className="text-sm font-medium">Ma position actuelle</span>
            </Button>
        </div>
    </div>
  )
}

