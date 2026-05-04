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
      email,
      password,
      options: { data: { full_name: fullName, role, color } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/carte')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-2xl font-bold">MW</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Nom complet"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-blue-500"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            {(['vendeur', 'manager'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`py-3 rounded-xl font-medium capitalize border transition-colors ${
                  role === r ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                {r}
              </button>
            ))}
          </div>

          {role === 'manager' && (
            <input
              type="password"
              placeholder="Code manager"
              value={managerCode}
              onChange={e => setManagerCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          )}

          <div>
            <p className="text-slate-400 text-sm mb-2">Ta couleur sur la carte</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    color === c.value ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-base transition-colors disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Déjà un compte ?{' '}
          <a href="/login" className="text-blue-400 font-medium">Se connecter</a>
        </p>
      </div>
    </div>
  )
}