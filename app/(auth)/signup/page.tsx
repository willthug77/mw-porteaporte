'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const COLORS = [
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Noir', value: '#1F2937' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Jaune', value: '#EAB308' },
]

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'vendeur' | 'manager'>('vendeur')
  const [color, setColor] = useState('#3B82F6')
  const [managerCode, setManagerCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (role === 'manager' && managerCode !== 'MW2024MANAGER') {
      setError('Code manager invalide')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role, color } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/carte')
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', color: 'white', fontSize: 16, outline: 'none', width: '100%' }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top, #1a2744 0%, #0A0F1E 70%)', zIndex: 0 }} />
      
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 20, marginBottom: 16, boxShadow: '0 8px 32px rgba(37,99,235,0.4)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>MW</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 24, margin: 0 }}>Créer un compte</h1>
          <p style={{ color: '#64748B', marginTop: 6, fontSize: 14 }}>MW Multiservices — Équipe terrain</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="text" placeholder="Nom complet" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inputStyle} type="password" placeholder="Mot de passe (min. 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} required />

          {/* Rôle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['vendeur', 'manager'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ padding: '14px', borderRadius: 12, fontWeight: 600, fontSize: 14, border: `1px solid ${role === r ? '#2563EB' : 'rgba(255,255,255,0.1)'}`, background: role === r ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)', color: role === r ? '#60A5FA' : '#64748B', cursor: 'pointer', textTransform: 'capitalize' }}>
                {r === 'vendeur' ? '🚶 Vendeur' : '👔 Manager'}
              </button>
            ))}
          </div>

          {role === 'manager' && (
            <input style={inputStyle} type="password" placeholder="Code manager" value={managerCode} onChange={e => setManagerCode(e.target.value)} />
          )}

          {/* Couleur */}
          <div>
            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 10, fontWeight: 500 }}>Ta couleur sur la carte</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: c.value, border: `3px solid ${color === c.value ? 'white' : 'transparent'}`, cursor: 'pointer', transform: color === c.value ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#FCA5A5', fontSize: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 700, padding: '17px', borderRadius: 14, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)' }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 14, marginTop: 24 }}>
          Déjà un compte ?{' '}
          <a href="/login" style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>Se connecter</a>
        </p>
      </div>
    </div>
  )
}