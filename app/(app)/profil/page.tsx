'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
    <div style={{ height: '100%', overflowY: 'auto', background: '#0A0F1E' }}>
      <div style={{ padding: '24px 20px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '20px', background: 'linear-gradient(135deg, #1E293B, #0F172A)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: profile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 22, flexShrink: 0, boxShadow: `0 4px 20px ${profile.color}60` }}>
            {profile.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0 }}>{profile.full_name}</p>
            <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0' }}>{profile.email}</p>
            <span style={{ background: 'rgba(37,99,235,0.2)', color: '#60A5FA', fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Stats perso */}
        <p style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mes statistiques</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: "Portes aujourd'hui", value: portesAujourdhui, color: 'white' },
            { label: 'Total portes', value: doors.length, color: 'white' },
            { label: 'Total ventes', value: ventes, color: '#34D399' },
            { label: 'Taux closing', value: `${taux}%`, color: '#60A5FA' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ color: '#64748B', fontSize: 11, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 24, fontWeight: 700, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {montant > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#6EE7B7', fontSize: 12, margin: '0 0 2px', fontWeight: 500 }}>Total vendu</p>
              <p style={{ color: '#34D399', fontSize: 28, fontWeight: 800, margin: 0 }}>{montant.toLocaleString('fr-CA')} $</p>
            </div>
            <span style={{ fontSize: 36 }}>💰</span>
          </div>
        )}

        {/* Infos */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#64748B', fontSize: 13 }}>Couleur terrain</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: profile.color, border: '2px solid rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748B', fontSize: 13 }}>Équipe</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>MW Multiservices</span>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ width: '100%', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontWeight: 600, padding: '16px', borderRadius: 16, fontSize: 15, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}