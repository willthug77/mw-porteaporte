'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import DoorForm, { Door } from '@/components/DoorForm'
import DoorDetailSheet, { DoorDetail } from '@/components/DoorDetailSheet'
import { Plus } from 'lucide-react'

const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F2F2' }}>
        <p style={{ color: '#374151', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Chargement de la carte...</p>
      </div>
    ),
  }
)

export default function CartePage() {
  const [profile, setProfile] = useState<any>(null)
  const [doors, setDoors] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formCoords, setFormCoords] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [editDoor, setEditDoor] = useState<Door | null>(null)
  const [detailDoor, setDetailDoor] = useState<DoorDetail | null>(null)
  // Incrementing this signal tells MapComponent to remove the temporary marker
  const [clearTempSignal, setClearTempSignal] = useState(0)

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
      .select('id, user_id, latitude, longitude, address, status, service_type, contract_value, scheduled_date, objection, notes, follow_up_needed, follow_up_date, client_name, phone, created_at, profiles(full_name, color)')
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

  // Clic sur un pin → DoorDetailSheet (lecture seule)
  const handleDoorClick = useCallback((door: any) => {
    setDetailDoor(door as DoorDetail)
  }, [])

  // Depuis DoorDetailSheet → ouvrir DoorForm en mode édition
  const handleEditFromDetail = useCallback(() => {
    if (!detailDoor) return
    setEditDoor(detailDoor as unknown as Door)
    setDetailDoor(null)
  }, [detailDoor])

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

  // Mode création — insert géré par le parent
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
    setClearTempSignal(s => s + 1) // retire le marker temporaire
    loadDoors()
  }

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setFormCoords(null)
    setClearTempSignal(s => s + 1) // annulation → retire le marker temporaire
  }, [])

  // Mode édition — update géré par DoorForm, on refetch seulement
  const handleEditSave = useCallback(() => {
    setEditDoor(null)
    loadDoors()
  }, [loadDoors])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <MapComponent
        doors={doors}
        onLongPress={handleLongPress}
        onDoorClick={handleDoorClick}
        clearTempMarkerSignal={clearTempSignal}
      />

      {/* Header flottant */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, pointerEvents: 'none', zIndex: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            padding: '8px 14px',
            border: '1px solid rgba(229,231,235,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>
              {profile?.full_name || '…'}
            </span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: 10,
            padding: '8px 12px',
            border: '1px solid rgba(229,231,235,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <span style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>
              {doors.length} portes
            </span>
          </div>
        </div>
      </div>

      {/* Bouton Nouvelle porte */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
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
          style={{
            background: '#69C9CA', color: '#000000', fontWeight: 600,
            padding: '13px 28px', borderRadius: 12, fontSize: 15, border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(105,201,202,0.45)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Inter, sans-serif', transition: 'background 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4AADAE'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(74,173,174,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#69C9CA'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(105,201,202,0.45)' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nouvelle porte
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && formCoords && profile && (
        <DoorForm
          coords={formCoords}
          profile={profile}
          mode="create"
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {/* Fiche de consultation — clic sur un pin */}
      {detailDoor && (
        <DoorDetailSheet
          door={detailDoor}
          onClose={() => setDetailDoor(null)}
          onEdit={handleEditFromDetail}
        />
      )}

      {/* Formulaire édition — via bouton "Modifier" dans la fiche */}
      {editDoor && profile && (
        <DoorForm
          coords={{ lat: editDoor.latitude, lng: editDoor.longitude }}
          profile={profile}
          mode="edit"
          initialData={editDoor}
          onSave={handleEditSave}
          onClose={() => setEditDoor(null)}
        />
      )}
    </div>
  )
}
