'use client'
import React, { useEffect, useState } from 'react'
import { DoorOpen, CheckCircle, Percent, DollarSign, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDashboardVendeur } from '@/lib/hooks/useDashboardVendeur'
import StatCard from '@/components/dashboard/shared/StatCard'
import ProgressBar from '@/components/dashboard/shared/ProgressBar'
import SkeletonDashboard from '@/components/dashboard/shared/SkeletonDashboard'
import { DEFAULT_DAILY_GOAL, GOAL_DANGER_PERCENT } from '@/lib/config'

const STATUS_LABELS: Record<string, string> = {
  pas_repondu: 'Sans réponse',
  pas_interesse: 'Pas intéressé',
  interesse: 'Intéressé',
  a_rappeler: 'À rappeler',
  soumission: 'Soumission',
  vendu: 'Vendu',
}

function getFollowUpBadge(dateStr: string): { bg: string; color: string; label: string } {
  const today = new Date().toISOString().slice(0, 10)
  const d = dateStr.slice(0, 10)
  if (d < today) return { bg: '#FEE2E2', color: '#991B1B', label: 'En retard' }
  if (d === today) return { bg: '#FEF3C7', color: '#92400E', label: "Aujourd'hui" }
  return { bg: '#F3F4F6', color: '#374151', label: d }
}

function getMotivationalMessage(pct: number): string {
  if (pct === 0) return 'Commencez fort — chaque porte compte!'
  if (pct < 25) return 'Bon départ! Continuez sur cette lancée.'
  if (pct < 50) return 'Bonne progression, gardez le rythme!'
  if (pct < 75) return 'Plus que la moitié — vous y êtes presque!'
  if (pct < 90) return 'Excellent travail! L\'objectif est proche.'
  if (pct < 100) return 'Dernière ligne droite — vous pouvez le faire!'
  return 'Objectif atteint! Félicitations! 🎉'
}

export default function VendeurDashboard() {
  const [userId, setUserId] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('vous')
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setFirstName(data.full_name.split(' ')[0])
          }
          setUserLoading(false)
        })
    })
  }, [])

  const { stats, refetch } = useDashboardVendeur(userId)
  const loading = userLoading || stats.loading

  if (loading) return <SkeletonDashboard />

  const objectif = stats.objectifJour ?? DEFAULT_DAILY_GOAL
  const pctObjectif = objectif > 0 ? Math.round((stats.portesToday / objectif) * 100) : 0
  const progressColor =
    pctObjectif >= 100
      ? '#10B981'
      : pctObjectif >= GOAL_DANGER_PERCENT
      ? '#F59E0B'
      : '#69C9CA'

  const todayDate = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: '#F1F2F2',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              color: '#111827',
              fontWeight: 700,
              fontSize: 22,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Bonjour {firstName}!
          </h1>
          <p style={{ color: '#374151', fontSize: 13, margin: '4px 0 0' }}>{todayDate}</p>
        </div>
        <button
          onClick={refetch}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Actualiser"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div style={{ padding: '20px 16px 40px' }}>
        {/* Stats grid 2x2 */}
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
            icon={<DoorOpen size={20} />}
            delta={stats.portesToday - stats.portesHier}
            color="#69C9CA"
          />
          <StatCard
            title="Ventes"
            value={stats.ventesToday}
            icon={<CheckCircle size={20} />}
            delta={stats.ventesToday - stats.ventesHier}
            color="#10B981"
          />
          <StatCard
            title="Conversion"
            value={`${stats.tauxConversion}%`}
            icon={<Percent size={20} />}
            delta={Math.round((stats.tauxConversion - stats.tauxConversionHier) * 10) / 10}
            color="#3B82F6"
          />
          <StatCard
            title="Revenus"
            value={
              stats.revenusToday > 0
                ? `${stats.revenusToday.toLocaleString('fr-CA')} $`
                : '—'
            }
            icon={<DollarSign size={20} />}
            delta={
              stats.revenusToday !== stats.revenusHier
                ? stats.revenusToday - stats.revenusHier
                : undefined
            }
            color="#8B5CF6"
          />
        </div>

        {/* Objectif du jour */}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                color: '#374151',
                fontWeight: 600,
                fontSize: 14,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Objectif du jour
            </h2>
            <span
              style={{
                color: progressColor,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {pctObjectif}%
            </span>
          </div>
          <ProgressBar value={pctObjectif} color={progressColor} height={10} animated />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              alignItems: 'flex-end',
            }}
          >
            <div>
              <p style={{ color: '#111827', fontWeight: 600, fontSize: 15, margin: '0 0 2px' }}>
                {stats.portesToday} / {objectif} portes
              </p>
              <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
                {getMotivationalMessage(pctObjectif)}
              </p>
            </div>
            {stats.commissions > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 1px' }}>Commissions</p>
                <p style={{ color: '#8B5CF6', fontWeight: 700, fontSize: 15, margin: 0 }}>
                  {stats.commissions.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Suivis */}
        {stats.suivis.length > 0 && (
          <div>
            <h2
              style={{
                color: '#374151',
                fontWeight: 600,
                fontSize: 14,
                margin: '0 0 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Prochains suivis
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.suivis.map((suivi: any) => {
                const badge = suivi.follow_up_date
                  ? getFollowUpBadge(suivi.follow_up_date)
                  : { bg: '#F3F4F6', color: '#374151', label: '—' }
                return (
                  <div
                    key={suivi.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: '#111827',
                          fontWeight: 600,
                          fontSize: 13,
                          margin: '0 0 2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {suivi.client_name || suivi.address || 'Client'}
                      </p>
                      {suivi.phone && (
                        <p style={{ color: '#374151', fontSize: 12, margin: '0 0 1px' }}>
                          {suivi.phone}
                        </p>
                      )}
                      {suivi.notes && (
                        <p
                          style={{
                            color: '#6B7280',
                            fontSize: 11,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {suivi.notes}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          marginBottom: 4,
                        }}
                      >
                        {badge.label}
                      </span>
                      <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>
                        {STATUS_LABELS[suivi.status] || suivi.status}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stats.suivis.length === 0 && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: '24px 16px',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: 13,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            Aucun suivi planifié
          </div>
        )}
      </div>
    </div>
  )
}
