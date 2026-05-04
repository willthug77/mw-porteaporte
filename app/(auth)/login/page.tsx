'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/carte')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      
      {/* Background gradient */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #1a2744 0%, #0A0F1E 70%)', zIndex: 0 }} />
      
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 24, marginBottom: 20, boxShadow: '0 8px 32px rgba(37,99,235,0.4)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 28, letterSpacing: -1 }}>MW</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: -0.5 }}>MW Multiservices</h1>
          <p style={{ color: '#64748B', marginTop: 6, fontSize: 14 }}>Application terrain — Porte-à-porte</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', color: 'white', fontSize: 16, outline: 'none', width: '100%' }}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', color: 'white', fontSize: 16, outline: 'none', width: '100%' }}
          />

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#FCA5A5', fontSize: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 700, padding: '17px', borderRadius: 14, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 14, marginTop: 24 }}>
          Pas de compte ?{' '}
          <a href="/signup" style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</a>
        </p>
      </div>
    </div>
  )
}