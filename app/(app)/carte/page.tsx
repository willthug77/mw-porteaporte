'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import DoorForm from '@/components/DoorForm'
import PinPopup from '@/components/PinPopup'

const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <p style={{ color: '#64748B', fontSize: 14 }}>Chargement de la carte...</p>
      </div>
    ),
  }
)

export default function CartePage() {
  const [profile, setProfile] = useState<any>(null)
  const [doors, setDoors] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formCoords, setFormCoords] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [selectedDoor, setSelectedDoor] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [])

  const loadDoors = useCallback(async () => {
    const { data } = await supabase
      .from('doors')
      .select('*, profiles(full_name, color)')
      .order('created_at', { ascending: false })
    setDoors(data || [])
  }, [])

  useEffect(() => {
    loadDoors()
    const channel = supabase
      .channel('doors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doors' }, loadDoors)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadDoors])

  const handleLongPress = useCallback((lat: number, lng: number, address: string) => {
    setFormCoords({ lat, lng, address })
    setShowForm(true)
  }, [])

  const handleDoorClick = useCallback((door: any) => {
    setSelectedDoor(door)
  }, [])

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

  const handleFormSave = async (formData: any) => {
    if (!profile || !formCoords) return
    await supabase.from('doors').insert({
      user_id: profile.id,
      latitude: formCoords.lat,
      longitude: formCoords.lng,
      address: formCoords.address,
      ...formData,
    })
    setShowForm(false)
    setFormCoords(null)
    loadDoors()
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapComponent doors={doors} onLongPress={handleLongPress} onDoorClick={handleDoorClick} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16, pointerEvents: 'none', zIndex: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 14px' }}>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{profile?.full_name || '...'}</span>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 12px' }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>{doors.length} portes</span>
          </div>
        </div>
      </div>

      {/* Bouton ajouter */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <button
          onClick={async () => {
            navigator.geolocation.getCurrentPosition(
              async pos => {
                const address = await getAddress(pos.coords.latitude, pos.coords.longitude)
                setFormCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, address })
                setShowForm(true)
              },
              () => {
                setFormCoords({ lat: 45.45, lng: -73.45, address: '' })
                setShowForm(true)
              }
            )
          }}
          style={{ background: '#2563EB', color: 'white', fontWeight: 700, padding: '16px 32px', borderRadius: 20, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>+</span> Nouvelle porte
        </button>
      </div>

      {showForm && formCoords && profile && (
        <DoorForm coords={formCoords} profile={profile} onSave={handleFormSave} onClose={() => { setShowForm(false); setFormCoords(null) }} />
      )}

      {selectedDoor && (
        <PinPopup door={selectedDoor} onClose={() => setSelectedDoor(null)} />
      )}
    </div>
  )
}