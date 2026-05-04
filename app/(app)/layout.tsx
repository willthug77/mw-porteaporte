'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const nav = [
    { href: '/carte', label: 'Carte', icon: '🗺' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/profil', label: 'Profil', icon: '👤' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>
      <nav style={{ background: '#0F172A', borderTop: '1px solid #1E293B', display: 'flex' }}>
        {nav.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '10px 4px', textDecoration: 'none',
              color: active ? '#3B82F6' : '#64748B'
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}