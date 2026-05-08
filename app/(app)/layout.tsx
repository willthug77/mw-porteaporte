'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Map, BarChart2, User, Database } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

const NAV_BASE = [
  { href: '/carte',      label: 'Carte',      Icon: Map      },
  { href: '/dashboard',  label: 'Dashboard',  Icon: BarChart2 },
]

const NAV_MANAGER_EXTRA = [
  { href: '/base-de-donnees', label: 'Base',  Icon: Database },
]

const NAV_PROFIL = [
  { href: '/profil', label: 'Profil', Icon: User },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [role, setRole]       = useState<string>('vendeur')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      setRole(profileData?.role ?? 'vendeur')
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #000000 0%, #0D1F1F 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Image
            src="/logo-mw.svg"
            alt="MW Multiservices"
            width={140}
            height={48}
            style={{ filter: 'brightness(0) invert(1)' }}
            priority
          />
        </div>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(105,201,202,0.2)',
          borderTopColor: '#69C9CA',
          borderRadius: '50%',
          animation: 'mw-spin 0.8s linear infinite',
          margin: '0 auto',
        }} />
        <style>{`@keyframes mw-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  const isManager = role === 'manager'
  const NAV = [
    ...NAV_BASE,
    ...(isManager ? NAV_MANAGER_EXTRA : []),
    ...NAV_PROFIL,
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#F1F2F2',
      fontFamily: 'Inter, sans-serif',
    }}>
      <AppHeader />
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map(({ href, Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 4px 10px',
              textDecoration: 'none',
              gap: 4,
              borderTop: active ? '2px solid #69C9CA' : '2px solid transparent',
              transition: 'border-color 150ms ease',
            }}>
              <Icon
                size={22}
                color={active ? '#69C9CA' : '#4B5563'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: active ? '#69C9CA' : '#4B5563',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
