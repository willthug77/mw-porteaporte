'use client'
import { useEffect, useRef } from 'react'

interface Door {
  id: string
  latitude: number
  longitude: number
  status: string
  profiles?: { full_name: string; color: string }
  client_name?: string
  contract_value?: number
  created_at: string
  notes?: string
  service_type?: string
  objection?: string
  address?: string
}

interface Props {
  doors: Door[]
  onLongPress: (lat: number, lng: number, address: string) => void
  onDoorClick: (door: Door) => void
}

const getAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'MW-Porteaporte/1.0' } }
    )
    const data = await res.json()
    if (data.address) {
      const a = data.address
      const num = a.house_number || ''
      const rue = a.road || ''
      const ville = a.city || a.town || a.village || ''
      return `${num} ${rue}, ${ville}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
    }
  } catch (e) {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export default function MapComponent({ doors, onLongPress, onDoorClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // stores the L.Map instance directly (not a wrapper object)
  const mapInstanceRef = useRef<any>(null)
  // stores L (Leaflet library) separately so markers effect can access it
  const leafletRef = useRef<any>(null)
  // stores touch handler refs for cleanup
  const cleanupRef = useRef<{ container: HTMLElement; onTouchStart: any; onTouchMove: any; onTouchEnd: any } | null>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const pressTimerRef = useRef<any>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix #1: destroy any pre-existing Leaflet instance on this container
      // (guards against React StrictMode double-invocation)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapRef.current!, {
        center: [45.45, -73.45],
        zoom: 15,
        zoomControl: false,
      })

      // Store immediately so updateUserPos can use it before initMap completes
      mapInstanceRef.current = map
      leafletRef.current = L

      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Fix #2: updateUserPos uses mapInstanceRef.current instead of closure `map`
      const updateUserPos = (pos: GeolocationPosition) => {
        if (!mapInstanceRef.current) return
        const { latitude, longitude } = pos.coords
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude])
        } else {
          const icon = L.divIcon({
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#69C9CA;border:3px solid white;box-shadow:0 0 0 5px rgba(105,201,202,0.25)"></div>`,
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
          userMarkerRef.current = L.marker([latitude, longitude], { icon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current)
          mapInstanceRef.current.setView([latitude, longitude], 17)
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateUserPos)
        watchIdRef.current = navigator.geolocation.watchPosition(
          updateUserPos,
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        )
      }

      // Long press desktop
      map.on('mousedown', (e: any) => {
        pressStartRef.current = { x: e.containerPoint.x, y: e.containerPoint.y }
        movedRef.current = false
        pressTimerRef.current = setTimeout(async () => {
          if (!movedRef.current) {
            const address = await getAddress(e.latlng.lat, e.latlng.lng)
            onLongPress(e.latlng.lat, e.latlng.lng, address)
          }
        }, 600)
      })
      map.on('mousemove', (e: any) => {
        if (pressStartRef.current) {
          const dx = Math.abs(e.containerPoint.x - pressStartRef.current.x)
          const dy = Math.abs(e.containerPoint.y - pressStartRef.current.y)
          if (dx > 8 || dy > 8) {
            movedRef.current = true
            if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
          }
        }
      })
      map.on('mouseup', () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current) })

      // Long press mobile
      const container = map.getContainer()
      const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0]
        pressStartRef.current = { x: touch.clientX, y: touch.clientY }
        movedRef.current = false
        pressTimerRef.current = setTimeout(async () => {
          if (!movedRef.current) {
            const rect = container.getBoundingClientRect()
            const point = map.containerPointToLatLng(
              L.point(touch.clientX - rect.left, touch.clientY - rect.top)
            )
            if (navigator.vibrate) navigator.vibrate(50)
            const address = await getAddress(point.lat, point.lng)
            onLongPress(point.lat, point.lng, address)
          }
        }, 600)
      }
      const onTouchMove = (e: TouchEvent) => {
        if (pressStartRef.current) {
          const t = e.touches[0]
          if (Math.abs(t.clientX - pressStartRef.current.x) > 8 ||
            Math.abs(t.clientY - pressStartRef.current.y) > 8) {
            movedRef.current = true
            if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
          }
        }
      }
      const onTouchEnd = () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current) }

      container.addEventListener('touchstart', onTouchStart, { passive: true })
      container.addEventListener('touchmove', onTouchMove, { passive: true })
      container.addEventListener('touchend', onTouchEnd)

      cleanupRef.current = { container, onTouchStart, onTouchMove, onTouchEnd }
    }

    initMap()

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      if (cleanupRef.current) {
        const { container, onTouchStart, onTouchMove, onTouchEnd } = cleanupRef.current
        container.removeEventListener('touchstart', onTouchStart)
        container.removeEventListener('touchmove', onTouchMove)
        container.removeEventListener('touchend', onTouchEnd)
        cleanupRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return
    const map = mapInstanceRef.current
    const L = leafletRef.current
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    doors.forEach(door => {
      const vendeurColor = door.profiles?.color || '#69C9CA'
      const outerColor = door.status === 'vendu' ? '#10B981' : '#EF4444'
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24S32 27 32 16C32 7.2 24.8 0 16 0z"
          fill="${outerColor}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
        <circle cx="16" cy="16" r="5" fill="${vendeurColor}"/>
      </svg>`
      const icon = L.divIcon({ html: svg, className: '', iconSize: [32, 40], iconAnchor: [16, 40] })
      const marker = L.marker([door.latitude, door.longitude], { icon }).addTo(map)
      marker.on('click', () => onDoorClick(door))
      markersRef.current.push(marker)
    })
  }, [doors, onDoorClick])

  const recenter = () => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    if (userMarkerRef.current) {
      map.setView(userMarkerRef.current.getLatLng(), 17)
    } else {
      navigator.geolocation.getCurrentPosition(pos => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 17)
      })
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Bouton localisation — bas gauche pour éviter le chevauchement avec zoom (bas droit) */}
      <button
        onClick={recenter}
        style={{
          position: 'absolute', bottom: 16, left: 12, zIndex: 1000,
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '50%',
          width: 44, height: 44,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}
      >
        📍
      </button>
    </div>
  )
}
