'use client'

import 'leaflet/dist/leaflet.css'

import type { Map as LeafletMap } from 'leaflet'
import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface LocationPinDisplayProps {
  lat?: number | string | null
  lng?: number | string | null
  salonName?: string
  address?: string | null
  className?: string
  heightClass?: string
}

export default function LocationPinDisplay({
  lat,
  lng,
  salonName = 'Salon Location',
  address,
  className = '',
  heightClass = 'h-52 sm:h-64',
}: LocationPinDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)

  const numLat = typeof lat === 'number' ? lat : typeof lat === 'string' ? parseFloat(lat) : null
  const numLng = typeof lng === 'number' ? lng : typeof lng === 'string' ? parseFloat(lng) : null
  const hasCoordinates = numLat !== null && numLng !== null && !isNaN(numLat) && !isNaN(numLng)

  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null

  useEffect(() => {
    if (!hasCoordinates || !mapContainerRef.current || numLat === null || numLng === null) return
    const validLat = numLat
    const validLng = numLng
    let isMounted = true

    async function initDisplayMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return

      const L = await import('leaflet')
      if (!isMounted || !mapContainerRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [validLat, validLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const pinIcon = L.divIcon({
        className: 'custom-display-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; transform: translate(-50%, -100%);">
            <svg width="32" height="40" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#b45309"/>
              <circle cx="12" cy="11" r="5" fill="#ffffff"/>
              <circle cx="12" cy="11" r="2.5" fill="#b45309"/>
            </svg>
          </div>
        `,
        iconSize: [34, 40],
        iconAnchor: [17, 40],
      })

      const marker = L.marker([validLat, validLng], { icon: pinIcon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 2px;">
          <strong style="color: #1e293b; font-size: 13px;">${salonName}</strong>
          ${address ? `<p style="color: #64748b; margin-top: 2px;">${address}</p>` : ''}
        </div>
      `)

      mapInstanceRef.current = map
    }

    void initDisplayMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [hasCoordinates, numLat, numLng, salonName, address])

  return (
    <div className={`space-y-2.5 ${className}`}>
      {hasCoordinates ? (
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 shadow-2xs">
          <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

          {directionsUrl && (
            <div className="absolute bottom-2.5 right-2.5 z-1000">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-stone-900"
              >
                <Navigation className="h-3 w-3 text-amber-400" />
                <span>Get Directions</span>
                <ExternalLink className="h-2.5 w-2.5 text-stone-400" />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center ${heightClass}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-bold text-stone-900">{address || 'Location on map'}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Exact map coordinates not yet pinned by the salon.
          </p>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              <span>Search in Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
