'use client'
import React from 'react'
import ProgressBar from '@/components/dashboard/shared/ProgressBar'

interface VendeurCardProps {
  vendeur: any
  onClick?: () => void
  objectif?: number
}

export default function VendeurCard({ vendeur, onClick, objectif }: VendeurCardProps) {
  const initials = (vendeur.full_name || '??').slice(0, 2).toUpperCase()
  const color = vendeur.color || '#69C9CA'
  const portes = vendeur.portes_aujourd_hui ?? 0
  const ventes = vendeur.ventes_aujourd_hui ?? 0
  const montant = Number(vendeur.montant_aujourd_hui) || 0
  const totalPortes = vendeur.total_portes ?? 0
  const totalVentes = vendeur.total_ventes ?? 0
  const taux =
    totalPortes > 0 ? Math.round((totalVentes / totalPortes) * 1000) / 10 : 0
  const progress = objectif && objectif > 0 ? Math.round((portes / objectif) * 100) : null

  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        fontFamily: 'Inter, sans-serif',
        transition: 'box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: progress !== null ? 12 : 0 }}>
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#111827', fontWeight: 600, fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vendeur.full_name}
          </p>
          <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>
            {portes} portes · {ventes} ventes
          </p>
        </div>

        {/* Stats right */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: '#065F46', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>
            {montant > 0 ? `${montant.toLocaleString('fr-CA')} $` : '—'}
          </p>
          <p style={{ color: '#374151', fontSize: 11, margin: 0 }}>
            {taux}% conv.
          </p>
        </div>
      </div>

      {progress !== null && (
        <ProgressBar
          value={progress}
          color={color}
          height={6}
          animated
          label={`Objectif: ${portes}/${objectif} portes`}
        />
      )}
    </div>
  )
}
