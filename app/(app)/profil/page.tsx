'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [doors, setDoors] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      const { data: d } = await supabase.from('doors').select('*').eq('user_id', user.id)
      setDoors(d || [])
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const portesAujourdhui = doors.filter(d => d.created_at.startsWith(todayStr)).length
  const ventes = doors.filter(d => d.status === 'vendu').length
  const montant = doors.filter(d => d.status === 'vendu').reduce((s, d) => s + (d.contract_value || 0), 0)
  const taux = doors.length > 0 ? Math.round((ventes / doors.length) * 100) : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F1F2F2', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 20px 16px' }}>
        <h1 style={{ color: '#111827', fontWeight: 700, fontSize: 24, margin: 0, letterSpacing: '-0.02em' }}>Profil</h1>
      </div>

      <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Carte identité */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            background: profile.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: 20,
            flexShrink: 0,
          }}>
            {profile.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#111827', fontWeight: 700, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>
              {profile.full_name}
            </p>
            <p style={{ color: '#374151', fontSize: 13, margin: '3px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.email}
            </p>
            <span style={{
              background: '#E8F8F8',
              color: '#0D6E6F',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p style={{ color: '#374151', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 2px' }}>
            Mes statistiques
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: "Portes aujourd'hui", value: portesAujourdhui, color: '#111827' },
              { label: 'Total portes',       value: doors.length,     color: '#111827' },
              { label: 'Total ventes',       value: ventes,           color: '#065F46' },
              { label: 'Taux closing',       value: `${taux}%`,       color: '#0D6E6F' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <p style={{ color: '#374151', fontSize: 12, fontWeight: 500, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total vendu */}
        {montant > 0 && (
          <div style={{
            background: '#D1FAE5',
            border: '1px solid #A7F3D0',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#065F46', fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total vendu</p>
              <p style={{ color: '#065F46', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {montant.toLocaleString('fr-CA')} $
              </p>
            </div>
            <span style={{ fontSize: 32 }}>💰</span>
          </div>
        )}

        {/* Infos compte */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ color: '#374151', fontSize: 14 }}>Couleur terrain</span>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: profile.color, border: '2px solid #E5E7EB' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
            <span style={{ color: '#374151', fontSize: 14 }}>Équipe</span>
            <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>MW Multiservices</span>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            background: '#FFFFFF',
            color: '#EF4444',
            fontWeight: 600,
            padding: '14px 16px',
            borderRadius: 12,
            fontSize: 15,
            border: '1px solid #FECACA',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'Inter, sans-serif',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
