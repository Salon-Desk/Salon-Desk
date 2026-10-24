'use client'

import 'leaflet/dist/leaflet.css'

import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'

interface LocationPinPickerProps {
  lat?: number | null
  lng?: number | null
  address?: string
  onChange: (coords: { lat: number; lng: number; address?: string }) => void
  disabled?: boolean
  className?: string
}

const DEFAULT_CENTER = { lat: 9.0108, lng: 38.7613 } // Addis Ababa default

export default function LocationPinPicker({
  lat,
  lng,
  address,
  onChange,
  disabled = false,
  className = '',
}: LocationPinPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)

  const [currentLat, setCurrentLat] = useState<number>(lat ?? DEFAULT_CENTER.lat)
  const [currentLng, setCurrentLng] = useState<number>(lng ?? DEFAULT_CENTER.lng)
  const [searchQuery, setSearchQuery] = useState(address || '')
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // Sync internal state if props change from outside
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      setCurrentLat(lat)
      setCurrentLng(lng)
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([lat, lng])
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom())
      }
    }
  }, [lat, lng])

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return

      const L = await import('leaflet')
      if (!isMounted || !mapContainerRef.current) return

      const initialLat = typeof lat === 'number' ? lat : DEFAULT_CENTER.lat
      const initialLng = typeof lng === 'number' ? lng : DEFAULT_CENTER.lng

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: typeof lat === 'number' ? 15 : 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Modern SVG Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-salon-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transform: translate(-50%, -100%);">
            <div style="position: absolute; bottom: 0; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#b45309"/>
                <circle cx="12" cy="11" r="5" fill="#ffffff"/>
                <circle cx="12" cy="11" r="2.5" fill="#b45309"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
      })

      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: !disabled,
      }).addTo(map)

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        const newLat = Number(position.lat.toFixed(6))
        const newLng = Number(position.lng.toFixed(6))
        setCurrentLat(newLat)
        setCurrentLng(newLng)
        onChange({ lat: newLat, lng: newLng })
      })

      // Handle click on map to move marker
      map.on('click', (e) => {
        if (disabled) return
        const newLat = Number(e.latlng.lat.toFixed(6))
        const newLng = Number(e.latlng.lng.toFixed(6))
        marker.setLatLng([newLat, newLng])
        setCurrentLat(newLat)
        setCurrentLng(newLng)
        onChange({ lat: newLat, lng: newLng })
      })

      mapInstanceRef.current = map
      markerRef.current = marker
    }

    void initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker draggable if disabled prop changes
  useEffect(() => {
    if (markerRef.current) {
      if (disabled) {
        markerRef.current.dragging?.disable()
      } else {
        markerRef.current.dragging?.enable()
      }
    }
  }, [disabled])

  // Geocode address via OpenStreetMap Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim(),
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = (await res.json()) as { lat: string; lon: string; display_name: string }[]
      if (data && data.length > 0 && data[0]) {
        const resultLat = Number(parseFloat(data[0].lat).toFixed(6))
        const resultLng = Number(parseFloat(data[0].lon).toFixed(6))

        setCurrentLat(resultLat)
        setCurrentLng(resultLng)

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([resultLat, resultLng])
          mapInstanceRef.current.setView([resultLat, resultLng], 16)
        }

        onChange({
          lat: resultLat,
          lng: resultLng,
          address: data[0].display_name,
        })
        toast.success('Location found & pin updated', toastColor.success)
      } else {
        toast.error('Address not found. Click directly on the map to place pin.', toastColor.error)
      }
    } catch {
      toast.error('Geocoding request failed. Please place pin manually.', toastColor.error)
    } finally {
      setIsSearching(false)
    }
  }

  // Geolocation "Use My Current Location"
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser', toastColor.error)
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6))
        const userLng = Number(pos.coords.longitude.toFixed(6))

        setCurrentLat(userLat)
        setCurrentLng(userLng)

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([userLat, userLng])
          mapInstanceRef.current.setView([userLat, userLng], 16)
        }

        onChange({ lat: userLat, lng: userLng })
        toast.success('Pinned to current location', toastColor.success)
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        toast.error(`Could not get location: ${err.message}`, toastColor.error)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              disabled={disabled || isSearching}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address or area to center pin..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-2xs outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || isSearching || !searchQuery.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Find & Pin'}
          </button>
        </form>

        <button
          type="button"
          disabled={disabled || isLocating}
          onClick={handleLocateMe}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-amber-700 shadow-xs transition-colors hover:bg-amber-50 disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
          ) : (
            <Crosshair className="h-3.5 w-3.5 text-amber-600" />
          )}
          <span>Locate Me</span>
        </button>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} className="h-64 w-full sm:h-72 z-0" />

        {/* Drag Hint Overlay */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-1000 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-white shadow-xs backdrop-blur-xs">
          <MapPin className="h-3 w-3 text-amber-400" />
          <span>Click anywhere or drag pin to position</span>
        </div>
      </div>

      {/* Coordinate Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Latitude: <strong className="font-mono text-slate-700">{currentLat}</strong>
          </span>
          <span>
            Longitude: <strong className="font-mono text-slate-700">{currentLng}</strong>
          </span>
        </div>
        <span className="text-slate-400">
          Used for client &quot;Near Me&quot; distance discovery
        </span>
      </div>
    </div>
  )
}
