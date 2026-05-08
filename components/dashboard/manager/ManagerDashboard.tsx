'use client'
import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  DoorOpen,
  CheckCircle,
  DollarSign,
  Users,
  Shield,
  X,
  RefreshCw,
} from 'lucide-react'
import StatCard from '@/components/dashboard/shared/StatCard'
import VendeurCard from '@/components/dashboard/shared/VendeurCard'
import AlertBadge from '@/components/dashboard/shared/AlertBadge'
import SkeletonDashboard from '@/components/dashboard/shared/SkeletonDashboard'
import { useDashboardManager } from '@/lib/hooks/useDashboardManager'
import * as Q from '@/lib/queries/dashboard'
import {
  WORKING_HOURS_START,
  WORKING_HOURS_END,
  LOW_CONVERSION_THRESHOLD,
  DEFAULT_DAILY_GOAL,
} from '@/lib/config'
import { supabase } from '@/lib/supabase'

type Tab = 'global' | 'equipe' | 'analytiques' | 'alertes'

const STATUS_LABELS: Record<string, string> = {
  pas_repondu: 'Sans réponse',
  pas_interesse: 'Pas intéressé',
  interesse: 'Intéressé',
  a_rappeler: 'À rappeler',
  soumission: 'Soumission',
  vendu: 'Vendu',
}
const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pas_repondu: { bg: '#F3F4F6', color: '#6B7280' },
  pas_interesse: { bg: '#FEE2E2', color: '#991B1B' },
  interesse: { bg: '#FEF3C7', color: '#92400E' },
  a_rappeler: { bg: '#FEF3C7', color: '#92400E' },
  soumission: { bg: '#E8F8F8', color: '#0D6E6F' },
  vendu: { bg: '#D1FAE5', color: '#065F46' },
}

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('global')
  const [selectedVendeur, setSelectedVendeur] = useState<any>(null)
  const [showObjectifsModal, setShowObjectifsModal] = useState(false)
  const [managerId, setManagerId] = useState<string>('')
  const [objectifsInput, setObjectifsInput] = useState<Record<string, number>>({})
  const [globalInput, setGlobalInput] = useState<number>(DEFAULT_DAILY_GOAL)
  const [chart30Data, setChart30Data] = useState<Array<{ date: string; portes: number; ventes: number }>>([])
  const [hourData, setHourData] = useState<Array<{ heure: number; count: number }>>([])
  const [vendeurDoors, setVendeurDoors] = useState<any[]>([])
  const [objectifs, setObjectifs] = useState<Record<string, number>>({})

  const { stats, vendeurStats, dernieresPortes, chartData, vendeurs, loading, refetch } =
    useDashboardManager()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setManagerId(user.id)
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'analytiques') {
      const today = new Date().toISOString().slice(0, 10)
      Q.getPortes30Jours().then(setChart30Data)
      Q.getPortesParHeure(today).then(setHourData)
    }
  }, [activeTab])

  useEffect(() => {
    if (vendeurs.length > 0) {
      const initial: Record<string, number> = {}
      vendeurs.forEach((v) => {
        initial[v.id] = DEFAULT_DAILY_GOAL
      })
      setObjectifsInput(initial)
      setObjectifs(initial)
    }
  }, [vendeurs])

  const handleVendeurClick = async (v: any) => {
    setSelectedVendeur(v)
    const doors = await Q.getDernieresPortes(10, v.id)
    setVendeurDoors(doors)
  }

  const handleSaveObjectifs = async () => {
    if (!managerId) return
    const today = new Date().toISOString().slice(0, 10)
    await Promise.all(
      Object.entries(objectifsInput).map(([vid, obj]) =>
        Q.upsertObjectif(vid, managerId, today, obj)
      )
    )
    setObjectifs({ ...objectifsInput })
    setShowObjectifsModal(false)
  }

  const handleApplyAll = () => {
    const next: Record<string, number> = {}
    vendeurs.forEach((v) => { next[v.id] = globalInput })
    setObjectifsInput(next)
  }

  const todayDate = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Compute alerts
  const now = new Date()
  const currentHour = now.getHours()
  const isWorkingHours = currentHour >= WORKING_HOURS_START && currentHour < WORKING_HOURS_END

  const alerts: Array<{ vendeur: any; type: 'warning' | 'danger' | 'info'; alertType: string; description: string }> = []

  vendeurStats.forEach((v) => {
    const totalPortes = v.total_portes ?? 0
    const totalVentes = v.total_ventes ?? 0
    const portesAujourdhui = v.portes_aujourd_hui ?? 0

    if (isWorkingHours && portesAujourdhui === 0) {
      alerts.push({
        vendeur: v,
        type: 'warning',
        alertType: 'Inactif',
        description: `${v.full_name} n'a enregistré aucune porte aujourd'hui.`,
      })
    }

    if (totalPortes > 5 && (totalVentes / totalPortes) * 100 < LOW_CONVERSION_THRESHOLD) {
      alerts.push({
        vendeur: v,
        type: 'danger',
        alertType: 'Conversion faible',
        description: `Taux de conversion: ${Math.round((totalVentes / totalPortes) * 100)}% (seuil: ${LOW_CONVERSION_THRESHOLD}%)`,
      })
    }
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'global', label: 'Global' },
    { key: 'equipe', label: 'Équipe' },
    { key: 'analytiques', label: 'Analytiques' },
    { key: 'alertes', label: `Alertes${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
  ]

  if (loading) return <SkeletonDashboard />

  const chartDays = chartData.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' }),
  }))

  const chart30Days = chart30Data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
  }))

  const hourChartData = hourData
    .filter((h) => h.heure >= 7 && h.heure <= 21)
    .map((h) => ({ heure: `${h.heure}h`, count: h.count }))

  const conversionByVendeur = vendeurStats
    .filter((v) => (v.total_portes ?? 0) > 0)
    .map((v) => ({
      name: (v.full_name || '').split(' ')[0],
      taux: Math.round(((v.total_ventes ?? 0) / (v.total_portes ?? 1)) * 100),
      fill: v.color || '#69C9CA',
    }))

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#F1F2F2',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 16px 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <h1
              style={{
                color: '#111827',
                fontWeight: 700,
                fontSize: 20,
                margin: '0 0 2px',
                letterSpacing: '-0.02em',
              }}
            >
              Dashboard Manager
            </h1>
            <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>{todayDate}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={refetch}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Actualiser"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowObjectifsModal(true)}
              style={{
                background: '#69C9CA',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              Objectifs
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0,
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #69C9CA' : '2px solid transparent',
                color: activeTab === tab.key ? '#69C9CA' : '#6B7280',
                fontWeight: activeTab === tab.key ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* ---- GLOBAL ---- */}
        {activeTab === 'global' && (
          <div style={{ padding: '16px 16px 40px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <StatCard
                title="Portes"
                value={stats.portesToday}
                icon={<DoorOpen size={18} />}
                delta={stats.portesToday - stats.portesHier}
                color="#69C9CA"
              />
              <StatCard
                title="Ventes"
                value={stats.ventesToday}
                icon={<CheckCircle size={18} />}
                delta={stats.ventesToday - stats.ventesHier}
                color="#10B981"
              />
              <StatCard
                title="Revenus"
                value={
                  stats.revenusToday > 0
                    ? `${stats.revenusToday.toLocaleString('fr-CA')} $`
                    : '—'
                }
                icon={<DollarSign size={18} />}
                color="#8B5CF6"
              />
              <StatCard
                title="Vendeurs"
                value={vendeurs.length}
                icon={<Users size={18} />}
                color="#F59E0B"
              />
            </div>

            {/* 7-day chart */}
            {chartDays.length > 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: 13,
                    margin: '0 0 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  7 derniers jours
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartDays} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <Bar dataKey="portes" name="Portes" fill="#69C9CA" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ventes" name="Ventes" fill="#10B981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Activité récente */}
            <h2
              style={{
                color: '#374151',
                fontWeight: 600,
                fontSize: 13,
                margin: '0 0 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Activité récente
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dernieresPortes.map((door: any) => {
                const badge = STATUS_BADGE[door.status] || { bg: '#F3F4F6', color: '#6B7280' }
                const profile = door.profiles as any
                return (
                  <div
                    key={door.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: profile?.color || '#69C9CA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(profile?.full_name || '??').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#374151', fontSize: 11, margin: '0 0 1px' }}>
                        {profile?.full_name || '—'}
                      </p>
                      <p
                        style={{
                          color: '#111827',
                          fontSize: 12,
                          fontWeight: 500,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {door.address || door.client_name || '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          marginBottom: 2,
                        }}
                      >
                        {STATUS_LABELS[door.status] || door.status}
                      </span>
                      <p style={{ color: '#6B7280', fontSize: 10, margin: 0 }}>
                        {new Date(door.created_at).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              {dernieresPortes.length === 0 && (
                <div
                  style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 14 }}
                >
                  Aucune porte enregistrée
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- EQUIPE ---- */}
        {activeTab === 'equipe' && (
          <div style={{ padding: '16px 16px 40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vendeurStats.map((v) => (
                <VendeurCard
                  key={v.id}
                  vendeur={v}
                  onClick={() => handleVendeurClick(v)}
                  objectif={objectifs[v.id]}
                />
              ))}
              {vendeurStats.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                    color: '#6B7280',
                    fontSize: 14,
                  }}
                >
                  Aucun vendeur
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- ANALYTIQUES ---- */}
        {activeTab === 'analytiques' && (
          <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 30-day line chart */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <h2
                style={{
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: 13,
                  margin: '0 0 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Tendance 30 jours
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chart30Days} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: '#6B7280' }}
                    interval={Math.floor(chart30Days.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="portes"
                    name="Portes"
                    stroke="#69C9CA"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventes"
                    name="Ventes"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion by vendeur */}
            {conversionByVendeur.length > 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: 13,
                    margin: '0 0 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Conversion par vendeur
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    layout="vertical"
                    data={conversionByVendeur}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#374151' }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Taux']}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <Bar dataKey="taux" name="Conversion" fill="#69C9CA" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Activity by hour */}
            {hourChartData.length > 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: 13,
                    margin: '0 0 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Activité par heure (aujourd&apos;hui)
                </h2>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    data={hourChartData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="heure" tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <Bar dataKey="count" name="Portes" fill="#69C9CA" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Objectif vs réalisé */}
            {vendeurStats.length > 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: 13,
                    margin: '0 0 16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Objectif vs réalisé (aujourd&apos;hui)
                </h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={vendeurStats.map((v) => ({
                      name: (v.full_name || '').split(' ')[0],
                      réalisé: v.portes_aujourd_hui ?? 0,
                      objectif: objectifs[v.id] ?? DEFAULT_DAILY_GOAL,
                    }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="objectif" name="Objectif" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="réalisé" name="Réalisé" fill="#69C9CA" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ---- ALERTES ---- */}
        {activeTab === 'alertes' && (
          <div style={{ padding: '16px 16px 40px' }}>
            {alerts.length === 0 ? (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '48px 16px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <Shield size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#374151', fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>
                  Aucune alerte
                </p>
                <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
                  Tout se passe bien!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: alert.vendeur.color || '#69C9CA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontWeight: 700,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {(alert.vendeur.full_name || '??').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{ color: '#111827', fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}
                        >
                          {alert.vendeur.full_name}
                        </p>
                        <AlertBadge type={alert.type} label={alert.alertType} />
                      </div>
                    </div>
                    <p style={{ color: '#374151', fontSize: 13, margin: '0 0 10px' }}>
                      {alert.description}
                    </p>
                    <button
                      onClick={() => handleVendeurClick(alert.vendeur)}
                      style={{
                        background: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Voir le profil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VendeurDetail Modal */}
      {selectedVendeur && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedVendeur(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '20px 16px 40px',
              fontFamily: 'Inter, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: selectedVendeur.color || '#69C9CA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {(selectedVendeur.full_name || '??').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2
                  style={{ color: '#111827', fontWeight: 700, fontSize: 18, margin: '0 0 2px' }}
                >
                  {selectedVendeur.full_name}
                </h2>
                <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
                  {selectedVendeur.portes_aujourd_hui ?? 0} portes · {selectedVendeur.ventes_aujourd_hui ?? 0} ventes aujourd&apos;hui
                </p>
              </div>
              <button
                onClick={() => setSelectedVendeur(null)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  padding: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#374151" />
              </button>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                {
                  label: 'Total portes',
                  value: selectedVendeur.total_portes ?? 0,
                  color: '#69C9CA',
                },
                {
                  label: 'Total ventes',
                  value: selectedVendeur.total_ventes ?? 0,
                  color: '#10B981',
                },
                {
                  label: 'Conversion',
                  value:
                    (selectedVendeur.total_portes ?? 0) > 0
                      ? `${Math.round(((selectedVendeur.total_ventes ?? 0) / selectedVendeur.total_portes) * 100)}%`
                      : '0%',
                  color: '#3B82F6',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 10,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      color: s.color,
                      fontWeight: 700,
                      fontSize: 20,
                      margin: '0 0 2px',
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ color: '#6B7280', fontSize: 10, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent doors */}
            <h3
              style={{
                color: '#374151',
                fontWeight: 600,
                fontSize: 13,
                margin: '0 0 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Dernières portes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vendeurDoors.map((door: any) => {
                const badge = STATUS_BADGE[door.status] || { bg: '#F3F4F6', color: '#6B7280' }
                return (
                  <div
                    key={door.id}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: '#111827',
                          fontSize: 13,
                          fontWeight: 500,
                          margin: '0 0 2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {door.client_name || door.address || '—'}
                      </p>
                      <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>
                        {new Date(door.created_at).toLocaleString('fr-CA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {STATUS_LABELS[door.status] || door.status}
                      </span>
                      {door.contract_value && Number(door.contract_value) > 0 && (
                        <p
                          style={{
                            color: '#065F46',
                            fontSize: 12,
                            fontWeight: 700,
                            margin: '3px 0 0',
                          }}
                        >
                          {Number(door.contract_value).toLocaleString('fr-CA')} $
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              {vendeurDoors.length === 0 && (
                <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Aucune porte
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Objectifs Modal */}
      {showObjectifsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowObjectifsModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '20px 16px 40px',
              fontFamily: 'Inter, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ color: '#111827', fontWeight: 700, fontSize: 18, margin: 0 }}>
                Définir les objectifs
              </h2>
              <button
                onClick={() => setShowObjectifsModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: 8,
                  padding: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} color="#374151" />
              </button>
            </div>

            {/* Apply all */}
            <div
              style={{
                background: '#F9FAFB',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ color: '#374151', fontWeight: 500, fontSize: 13, margin: '0 0 4px' }}>
                  Appliquer à tous
                </p>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={globalInput}
                  onChange={(e) => setGlobalInput(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    color: '#111827',
                  }}
                />
              </div>
              <button
                onClick={handleApplyAll}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  flexShrink: 0,
                  alignSelf: 'flex-end',
                }}
              >
                Appliquer
              </button>
            </div>

            {/* Per-vendeur */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {vendeurs.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#F9FAFB',
                    borderRadius: 10,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: v.color || '#69C9CA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {(v.full_name || '??').slice(0, 2).toUpperCase()}
                  </div>
                  <p
                    style={{
                      color: '#111827',
                      fontWeight: 500,
                      fontSize: 13,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {v.full_name}
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={objectifsInput[v.id] ?? DEFAULT_DAILY_GOAL}
                    onChange={(e) =>
                      setObjectifsInput((prev) => ({
                        ...prev,
                        [v.id]: Number(e.target.value),
                      }))
                    }
                    style={{
                      width: 70,
                      padding: '6px 10px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                      color: '#111827',
                      textAlign: 'center',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveObjectifs}
              style={{
                width: '100%',
                background: '#69C9CA',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '14px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
