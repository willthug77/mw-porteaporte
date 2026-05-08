'use client'
import { supabase } from '@/lib/supabase'

// SQL to create objectifs table (run in Supabase SQL editor if not exists):
// CREATE TABLE IF NOT EXISTS objectifs (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   vendeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
//   manager_id UUID REFERENCES profiles(id),
//   date DATE NOT NULL,
//   objectif_portes INTEGER NOT NULL DEFAULT 20,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE(vendeur_id, date)
// );

export async function getPortesCount(date: string, userId?: string): Promise<number> {
  let query = supabase
    .from('doors')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { count } = await query
  return count ?? 0
}

export async function getVentesCount(date: string, userId?: string): Promise<number> {
  let query = supabase
    .from('doors')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'vendu')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { count } = await query
  return count ?? 0
}

export async function getRevenusToday(date: string, userId?: string): Promise<number> {
  let query = supabase
    .from('doors')
    .select('contract_value')
    .eq('status', 'vendu')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  if (!data) return 0
  return data.reduce((sum, d) => sum + (Number(d.contract_value) || 0), 0)
}

export async function getPortes7Jours(
  userId?: string
): Promise<Array<{ date: string; portes: number; ventes: number }>> {
  const end = new Date()
  const start = new Date(Date.now() - 6 * 86400000)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  let query = supabase
    .from('doors')
    .select('created_at, status')
    .gte('created_at', `${startStr}T00:00:00`)
    .lte('created_at', `${endStr}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  if (!data) return []

  const map: Record<string, { portes: number; ventes: number }> = {}
  for (let i = 0; i <= 6; i++) {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
    map[d] = { portes: 0, ventes: 0 }
  }

  for (const door of data) {
    const day = door.created_at.slice(0, 10)
    if (map[day]) {
      map[day].portes++
      if (door.status === 'vendu') map[day].ventes++
    }
  }

  return Object.entries(map).map(([date, v]) => ({ date, ...v }))
}

export async function getPortes30Jours(
  userId?: string
): Promise<Array<{ date: string; portes: number; ventes: number }>> {
  const end = new Date()
  const start = new Date(Date.now() - 29 * 86400000)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  let query = supabase
    .from('doors')
    .select('created_at, status')
    .gte('created_at', `${startStr}T00:00:00`)
    .lte('created_at', `${endStr}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  if (!data) return []

  const map: Record<string, { portes: number; ventes: number }> = {}
  for (let i = 0; i <= 29; i++) {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    map[d] = { portes: 0, ventes: 0 }
  }

  for (const door of data) {
    const day = door.created_at.slice(0, 10)
    if (map[day]) {
      map[day].portes++
      if (door.status === 'vendu') map[day].ventes++
    }
  }

  return Object.entries(map).map(([date, v]) => ({ date, ...v }))
}

export async function getObjectifJour(vendeurId: string, date: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('objectifs')
      .select('objectif_portes')
      .eq('vendeur_id', vendeurId)
      .eq('date', date)
      .maybeSingle()

    if (error) return null
    return data?.objectif_portes ?? null
  } catch {
    return null
  }
}

export async function upsertObjectif(
  vendeurId: string,
  managerId: string,
  date: string,
  objectif: number
): Promise<void> {
  try {
    await supabase.from('objectifs').upsert(
      { vendeur_id: vendeurId, manager_id: managerId, date, objectif_portes: objectif },
      { onConflict: 'vendeur_id,date' }
    )
  } catch {
    // silently fail if table doesn't exist
  }
}

export async function getSuivisVendeur(userId: string): Promise<any[]> {
  const { data } = await supabase
    .from('doors')
    .select('id, address, client_name, phone, follow_up_date, status, notes')
    .eq('user_id', userId)
    .eq('follow_up_needed', true)
    .not('follow_up_date', 'is', null)
    .order('follow_up_date', { ascending: true })
    .limit(5)

  return data ?? []
}

export async function getDernieresPortes(limit: number, userId?: string): Promise<any[]> {
  let query = supabase
    .from('doors')
    .select('id, address, status, contract_value, created_at, client_name, user_id, profiles(full_name, color)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  return data ?? []
}

export async function getAllVendeurs(): Promise<any[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, color, created_at')
    .eq('role', 'vendeur')

  return data ?? []
}

export async function getVendeurStats(): Promise<any[]> {
  const { data } = await supabase
    .from('vendeur_stats')
    .select('id, full_name, color, portes_aujourd_hui, ventes_aujourd_hui, montant_aujourd_hui, total_portes, total_ventes')

  return data ?? []
}

export async function getPortesParHeure(
  date: string,
  userId?: string
): Promise<Array<{ heure: number; count: number }>> {
  let query = supabase
    .from('doors')
    .select('created_at')
    .gte('created_at', `${date}T00:00:00`)
    .lt('created_at', `${date}T23:59:59.999`)

  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  if (!data) return []

  const map: Record<number, number> = {}
  for (let h = 0; h <= 23; h++) map[h] = 0

  for (const door of data) {
    const h = new Date(door.created_at).getHours()
    map[h] = (map[h] || 0) + 1
  }

  return Object.entries(map).map(([heure, count]) => ({ heure: Number(heure), count }))
}
