'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return null

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0F172A' }}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ color: 'white', fontWeight: 700, fontSize: 24, margin: 0 }}>Profil</h1>

        <div style={{ background: '#1E293B', borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: profile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            {profile.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>{profile.full_name}</p>
            <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0' }}>{profile.email}</p>
            <span style={{ background: '#1E3A5F', color: '#60A5FA', fontSize: 12, padding: '3px 10px', borderRadius: 8, fontWeight: 500 }}>
              {profile.role}
            </span>
          </div>
        </div>

        <div style={{ background: '#1E293B', borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 8px' }}>Ta couleur terrain</p>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: profile.color, border: '2px solid white' }} />
        </div>

        <div style={{ background: '#1E293B', borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 4px' }}>Équipe</p>
          <p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: 0 }}>MW Multiservices</p>
        </div>

        <button onClick={handleLogout}
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600, padding: '16px', borderRadius: 16, fontSize: 15, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}