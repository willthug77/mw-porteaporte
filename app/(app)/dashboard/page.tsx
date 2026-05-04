'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  pas_repondu: 'Sans réponse',
  pas_interesse: 'Pas intéressé',
  interesse: 'Intéressé',
  a_rappeler: 'À rappeler',
  soumission: 'Soumission',
  vendu: '✓ Vendu',
}

const STATUS_COLORS: Record<string, string> = {
  pas_repondu: '#475569',
  pas_interesse: '#EF4444',
  interesse: '#F97316',
  a_rappeler: '#EAB308',
  soumission: '#3B82F6',
  vendu: '#10B981',
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
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div style={{ height: '100%', overflowY: 'auto', background: '#0F172A' }}>
      <div style={{ padding: 20, paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 24, margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
            {profile?.role === 'manager' && <span style={{ color: '#60A5FA', fontWeight: 500 }}> · Vue Manager</span>}
          </p>
        </div>

        {/* Filtre vendeurs (manager seulement) */}
        {profile?.role === 'manager' && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            <button onClick={() => setFilterVendeur('all')}
              style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500, border: `1px solid ${filterVendeur === 'all' ? '#2563EB' : '#334155'}`, background: filterVendeur === 'all' ? '#2563EB' : '#1E293B', color: 'white', cursor: 'pointer' }}>
              Tous
            </button>
            {profiles.map(p => (
              <button key={p.id} onClick={() => setFilterVendeur(p.id)}
                style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500, border: `2px solid ${filterVendeur === p.id ? p.color : '#334155'}`, background: filterVendeur === p.id ? p.color + '30' : '#1E293B', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                {p.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StatCard label="Portes aujourd'hui" value={portesAujourdhui} color="white" />
          <StatCard label="Vendu aujourd'hui" value={montantAujourdhui > 0 ? `${montantAujourdhui.toLocaleString('fr-CA')} $` : '—'} color="#34D399" />
          <StatCard label="Ventes semaine" value={ventesSemaine} color="#60A5FA" />
          <StatCard label="Taux de closing" value={`${tauxClosing}%`} color="#FB923C" />
        </div>

        {/* Table équipe (manager) */}
        {profile?.role === 'manager' && vendeurStats.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Équipe aujourd'hui</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vendeurStats.map((v: any) => (
                <div key={v.id} style={{ background: '#1E293B', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {v.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{v.full_name}</p>
                    <p style={{ color: '#64748B', fontSize: 12, margin: '2px 0 0' }}>
                      {v.portes_aujourd_hui} portes · {v.ventes_aujourd_hui} ventes
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#34D399', fontWeight: 700, fontSize: 14, margin: 0 }}>
                      {Number(v.montant_aujourd_hui) > 0 ? `${Number(v.montant_aujourd_hui).toLocaleString('fr-CA')} $` : '—'}
                    </p>
                    <p style={{ color: '#64748B', fontSize: 11, margin: '2px 0 0' }}>
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
          <h2 style={{ color: 'white', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            {profile?.role === 'manager' ? 'Dernières portes' : 'Mes dernières portes'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.slice(0, 20).map((door: any) => (
              <div key={door.id} style={{ background: '#1E293B', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {profile?.role === 'manager' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: door.profiles?.color || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {door.profiles?.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  {profile?.role === 'manager' && (
                    <p style={{ color: '#64748B', fontSize: 11, margin: '0 0 2px' }}>{door.profiles?.full_name}</p>
                  )}
                  <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>
                    {new Date(door.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {door.client_name && <p style={{ color: 'white', fontSize: 13, margin: '2px 0 0' }}>{door.client_name}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[door.status] + '25', color: STATUS_COLORS[door.status] }}>
                    {STATUS_LABELS[door.status]}
                  </span>
                  {door.contract_value && (
                    <p style={{ color: '#34D399', fontSize: 12, fontWeight: 700, margin: '4px 0 0' }}>
                      {Number(door.contract_value).toLocaleString('fr-CA')} $
                    </p>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p style={{ color: '#475569', textAlign: 'center', padding: '32px 0' }}>Aucune porte enregistrée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 16, padding: '14px 16px' }}>
      <p style={{ color: '#64748B', fontSize: 11, margin: '0 0 4px' }}>{label}</p>
      <p style={{ color, fontSize: 22, fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  )
}