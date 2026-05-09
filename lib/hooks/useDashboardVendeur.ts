'use client'
import { useState, useEffect, useCallback } from 'react'
import * as Q from '@/lib/queries/dashboard'

export interface VendeurStats {
  portesToday: number
  portesHier: number
  ventesToday: number
  ventesHier: number
  revenusToday: number
  revenusHier: number
  tauxConversion: number
  tauxConversionHier: number
  objectifJour: number | null
  commissions: number
  suivis: any[]
  loading: boolean
  profile: any | null
  ventesParJour7: Array<{ date: string; montant: number; nbVentes: number }>
}

const defaults: VendeurStats = {
  portesToday: 0,
  portesHier: 0,
  ventesToday: 0,
  ventesHier: 0,
  revenusToday: 0,
  revenusHier: 0,
  tauxConversion: 0,
  tauxConversionHier: 0,
  objectifJour: null,
  commissions: 0,
  suivis: [],
  loading: true,
  profile: null,
  ventesParJour7: [],
}

export function useDashboardVendeur(userId: string) {
  const [stats, setStats] = useState<VendeurStats>({ ...defaults, loading: true })

  const fetchAll = useCallback(async () => {
    if (!userId) return

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const [
      profile,
      portesToday,
      ventesToday,
      revenusToday,
      portesHier,
      ventesHier,
      revenusHier,
      suivis,
      ventesParJour7,
    ] = await Promise.all([
      Q.getProfileForDashboard(userId),
      Q.getPortesCount(today, userId),
      Q.getVentesCount(today, userId),
      Q.getRevenusToday(today, userId),
      Q.getPortesCount(yesterday, userId),
      Q.getVentesCount(yesterday, userId),
      Q.getRevenusToday(yesterday, userId),
      Q.getSuivisVendeur(userId),
      Q.getVentesParJour7(userId),
    ])

    const tauxConversion =
      portesToday > 0 ? Math.round((ventesToday / portesToday) * 1000) / 10 : 0
    const tauxConversionHier =
      portesHier > 0 ? Math.round((ventesHier / portesHier) * 1000) / 10 : 0

    let commissions = 0
    if (profile) {
      if (profile.commission_type === 'percent') {
        commissions = revenusToday * ((profile.commission_value || 0) / 100)
      } else if (profile.commission_type === 'fixed') {
        commissions = ventesToday * (profile.commission_value || 0)
      }
    }

    const objectifJour = profile?.daily_goal ?? null

    setStats({
      portesToday,
      portesHier,
      ventesToday,
      ventesHier,
      revenusToday,
      revenusHier,
      tauxConversion,
      tauxConversionHier,
      objectifJour,
      commissions,
      suivis,
      loading: false,
      profile,
      ventesParJour7,
    })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchAll()
  }, [userId, fetchAll])

  return { stats, refetch: fetchAll }
}
