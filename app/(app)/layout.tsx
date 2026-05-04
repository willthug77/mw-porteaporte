'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const NAV = [
  { href: '/carte', label: 'Carte', icon: '🗺️' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/profil', label: 'Profil', icon: '👤' },
]

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
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(37,99,235,0.4)' }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>MW</span>
        </div>
        <div style={{ width: 32, height: 32, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A0F1E' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 4px 8px', textDecoration: 'none', gap: 3,
              borderTop: active ? '2px solid #2563EB' : '2px solid transparent',
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#60A5FA' : '#475569', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}