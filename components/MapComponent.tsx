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
}

interface Props {
  doors: Door[]
  onLongPress: (lat: number, lng: number) => void
  onDoorClick: (door: Door) => void
}

const STATUS_COLORS: Record<string, string> = {
  pas_repondu: '#64748B',
  pas_interesse: '#EF4444',
  interesse: '#F97316',
  a_rappeler: '#EAB308',
  soumission: '#3B82F6',
  vendu: '#10B981',
}

export default function MapComponent({ doors, onLongPress, onDoorClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const pressTimerRef = useRef<any>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
if (mapRef.current._leaflet_id) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if ((mapRef.current as any)._leaflet_id) return
const map = L.map(mapRef.current!, {
        center: [45.45, -73.45],
        zoom: 15,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0','mt1','mt2','mt3'],
}).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 17)
          L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
            radius: 10, fillColor: '#3B82F6', color: 'white', weight: 3, fillOpacity: 1,
          }).addTo(map).bindPopup('<b>Ma position</b>')
        })
      }

      // Long press desktop
      map.on('mousedown', (e: any) => {
        pressStartRef.current = { x: e.containerPoint.x, y: e.containerPoint.y }
        movedRef.current = false
        pressTimerRef.current = setTimeout(() => {
          if (!movedRef.current) onLongPress(e.latlng.lat, e.latlng.lng)
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
        pressTimerRef.current = setTimeout(() => {
          if (!movedRef.current) {
            const rect = container.getBoundingClientRect()
            const point = map.containerPointToLatLng(
              L.point(touch.clientX - rect.left, touch.clientY - rect.top)
            )
            onLongPress(point.lat, point.lng)
            if (navigator.vibrate) navigator.vibrate(50)
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

      mapInstanceRef.current = { map, L, container, onTouchStart, onTouchMove, onTouchEnd }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        const { map, container, onTouchStart, onTouchMove, onTouchEnd } = mapInstanceRef.current
        container.removeEventListener('touchstart', onTouchStart)
        container.removeEventListener('touchmove', onTouchMove)
        container.removeEventListener('touchend', onTouchEnd)
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    const { map, L } = mapInstanceRef.current

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    doors.forEach(door => {
  const vendeurColor = door.profiles?.color || '#3B82F6'
  const outerColor = door.status === 'vendu' ? '#10B981' : '#EF4444'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24S32 27 32 16C32 7.2 24.8 0 16 0z"
      fill="${outerColor}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
    <circle cx="16" cy="16" r="5" fill="${vendeurColor}"/>
  </svg>`

  const icon = L.divIcon({
    html: svg, className: '',
    iconSize: [32, 40], iconAnchor: [16, 40],
  })

  const marker = L.marker([door.latitude, door.longitude], { icon }).addTo(map)
  marker.on('click', () => onDoorClick(door))
  markersRef.current.push(marker)
})
  }, [doors, onDoorClick])

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  )
}