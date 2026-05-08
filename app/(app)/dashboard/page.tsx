'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  pas_repondu:   'Sans réponse',
  pas_interesse: 'Pas intéressé',
  interesse:     'Intéressé',
  a_rappeler:    'À rappeler',
  soumission:    'Soumission',
  vendu:         '✓ Vendu',
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pas_repondu:   { bg: '#F3F4F6', color: '#6B7280' },
  pas_interesse: { bg: '#FEE2E2', color: '#991B1B' },
  interesse:     { bg: '#FEF3C7', color: '#92400E' },
  a_rappeler:    { bg: '#FEF3C7', color: '#92400E' },
  soumission:    { bg: '#E8F8F8', color: '#0D6E6F' },
  vendu:         { bg: '#D1FAE5', color: '#065F46' },
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [doors, setDoors] = useState<any[]>([])
  const [vendeurStats, setVendeurStats] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [filterVendeur, setFilterVendeur] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'vendeur')
      setProfiles(profs || [])

      let query = supabase.from('doors').select('*, profiles(full_name, color)').order('created_at', { ascending: false })
      if (prof?.role === 'vendeur') query = query.eq('user_id', user.id)
      const { data: doorsData } = await query
      setDoors(doorsData || [])

      if (prof?.role === 'manager') {
        const { data: stats } = await supabase.from('vendeur_stats').select('*')
        setVendeurStats(stats || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F2F2', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(105,201,202,0.2)', borderTopColor: '#69C9CA', borderRadius: '50%', animation: 'mw-spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes mw-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

  const filtered = filterVendeur === 'all' ? doors : doors.filter(d => d.user_id === filterVendeur)
  const portesAujourdhui = filtered.filter(d => d.created_at.startsWith(todayStr)).length
  const montantAujourdhui = filtered.filter(d => d.status === 'vendu' && d.created_at.startsWith(todayStr)).reduce((s, d) => s + (d.contract_value || 0), 0)
  const ventesSemaine = filtered.filter(d => d.status === 'vendu' && new Date(d.created_at) >= weekStart).length
  const tauxClosing = filtered.length > 0 ? Math.round((filtered.filter(d => d.status === 'vendu').length / filtered.length) * 100) : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F1F2F2', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 20px 16px' }}>
        <h1 style={{ color: '#111827', fontWeight: 700, fontSize: 24, margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: '#374151', fontSize: 13, margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
          {profile?.role === 'manager' && (
            <span style={{ color: '#69C9CA', fontWeight: 500 }}> · Vue Manager</span>
          )}
        </p>
      </div>

      <div style={{ padding: '20px 16px 40px' }}>

        {/* Filtre vendeurs (manager) */}
        {profile?.role === 'manager' && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            <button
              onClick={() => setFilterVendeur('all')}
              style={{
                flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${filterVendeur === 'all' ? '#69C9CA' : '#E5E7EB'}`,
                background: filterVendeur === 'all' ? '#E8F8F8' : '#FFFFFF',
                color: filterVendeur === 'all' ? '#0D6E6F' : '#6B7280',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
              Tous
            </button>
            {profiles.map(p => (
              <button key={p.id} onClick={() => setFilterVendeur(p.id)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${filterVendeur === p.id ? p.color : '#E5E7EB'}`,
                  background: filterVendeur === p.id ? p.color + '18' : '#FFFFFF',
                  color: filterVendeur === p.id ? p.color : '#6B7280',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Inter, sans-serif',
                }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                {p.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StatCard label="Portes aujourd'hui" value={portesAujourdhui} valueColor="#111827" />
          <StatCard label="Vendu aujourd'hui" value={montantAujourdhui > 0 ? `${montantAujourdhui.toLocaleString('fr-CA')} $` : '—'} valueColor="#065F46" />
          <StatCard label="Ventes semaine" value={ventesSemaine} valueColor="#69C9CA" />
          <StatCard label="Taux de closing" value={`${tauxClosing}%`} valueColor="#111827" />
        </div>

        {/* Équipe aujourd'hui (manager) */}
        {profile?.role === 'manager' && vendeurStats.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Équipe aujourd'hui
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vendeurStats.map((v: any) => (
                <div key={v.id} style={{
                  background: '#FFFFFF', borderRadius: 12, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: v.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>
                    {v.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#111827', fontWeight: 600, fontSize: 14, margin: 0 }}>{v.full_name}</p>
                    <p style={{ color: '#374151', fontSize: 12, margin: '2px 0 0' }}>
                      {v.portes_aujourd_hui} portes · {v.ventes_aujourd_hui} ventes
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#065F46', fontWeight: 700, fontSize: 14, margin: 0 }}>
                      {Number(v.montant_aujourd_hui) > 0 ? `${Number(v.montant_aujourd_hui).toLocaleString('fr-CA')} $` : '—'}
                    </p>
                    <p style={{ color: '#374151', fontSize: 11, margin: '2px 0 0' }}>
                      {v.total_portes > 0 ? `${Math.round((v.total_ventes / v.total_portes) * 100)}% closing` : '0%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dernières portes */}
        <div>
          <h2 style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {profile?.role === 'manager' ? 'Dernières portes' : 'Mes dernières portes'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.slice(0, 20).map((door: any) => {
              const badge = STATUS_BADGE[door.status] || { bg: '#F3F4F6', color: '#6B7280' }
              return (
                <div key={door.id} style={{
                  background: '#FFFFFF', borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  {profile?.role === 'manager' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: door.profiles?.color || '#69C9CA',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {door.profiles?.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {profile?.role === 'manager' && (
                      <p style={{ color: '#374151', fontSize: 11, margin: '0 0 1px' }}>{door.profiles?.full_name}</p>
                    )}
                    <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>
                      {new Date(door.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {door.client_name && (
                      <p style={{ color: '#111827', fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>{door.client_name}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                      background: badge.bg, color: badge.color,
                    }}>
                      {STATUS_LABELS[door.status]}
                    </span>
                    {door.contract_value && (
                      <p style={{ color: '#065F46', fontSize: 12, fontWeight: 700, margin: '4px 0 0' }}>
                        {Number(door.contract_value).toLocaleString('fr-CA')} $
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontSize: 14 }}>
                Aucune porte enregistrée
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, valueColor }: { label: string; value: any; valueColor: string }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      padding: '16px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <p style={{ color: '#374151', fontSize: 12, fontWeight: 500, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: valueColor, fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}
