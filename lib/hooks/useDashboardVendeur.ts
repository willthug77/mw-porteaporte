'use client'
import { useState, useEffect, useCallback } from 'react'
import * as Q from '@/lib/queries/dashboard'
import { COMMISSION_RATE } from '@/lib/config'

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
}

export function useDashboardVendeur(userId: string) {
  const [stats, setStats] = useState<VendeurStats>({ ...defaults, loading: true })
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchAll = useCallback(async () => {
    if (!userId) return

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const [
      portesToday,
      ventesToday,
      revenusToday,
      portesHier,
      ventesHier,
      revenusHier,
      objectifJour,
      suivis,
    ] = await Promise.all([
      Q.getPortesCount(today, userId),
      Q.getVentesCount(today, userId),
      Q.getRevenusToday(today, userId),
      Q.getPortesCount(yesterday, userId),
      Q.getVentesCount(yesterday, userId),
      Q.getRevenusToday(yesterday, userId),
      Q.getObjectifJour(userId, today),
      Q.getSuivisVendeur(userId),
    ])

    const tauxConversion =
      portesToday > 0 ? Math.round((ventesToday / portesToday) * 1000) / 10 : 0
    const tauxConversionHier =
      portesHier > 0 ? Math.round((ventesHier / portesHier) * 1000) / 10 : 0
    const commissions = revenusToday * COMMISSION_RATE

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
    })
    setLastFetch(Date.now())
  }, [userId])

  useEffect(() => {
    if (!userId) return
    if (Date.now() - lastFetch < 5 * 60 * 1000 && lastFetch > 0) return
    fetchAll()
  }, [userId, fetchAll, lastFetch])

  return { stats, refetch: fetchAll }
}
