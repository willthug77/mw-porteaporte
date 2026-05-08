'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  initialSettings: Record<string, string>
  onSaved?: () => void
}

const field: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  color: '#1F2937',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  background: '#FFFFFF',
  boxSizing: 'border-box',
}

const focus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#69C9CA'
  e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)'
}
const blur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#E5E7EB'
  e.target.style.boxShadow = 'none'
}

export default function AppSettingsForm({ initialSettings, onSaved }: Props) {
  const [companyName, setCompanyName] = useState(initialSettings.company_name || 'MW Multiservices')
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primary_color || '#69C9CA')
  const [subtitle, setSubtitle] = useState(initialSettings.subtitle || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      supabase.from('app_settings').upsert({ key: 'company_name', value: companyName }, { onConflict: 'key' }),
      supabase.from('app_settings').upsert({ key: 'primary_color', value: primaryColor }, { onConflict: 'key' }),
      supabase.from('app_settings').upsert({ key: 'subtitle', value: subtitle }, { onConflict: 'key' }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSaved?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
          Nom de l'entreprise
        </label>
        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={field} onFocus={focus} onBlur={blur} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
          Slogan / Sous-titre
        </label>
        <input
          type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
          placeholder="L'excellence à votre service" style={field} onFocus={focus} onBlur={blur}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
          Couleur principale
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            style={{ width: 44, height: 44, border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'none', flexShrink: 0 }}
          />
          <input
            type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            style={{ ...field, flex: 1 }} placeholder="#69C9CA" maxLength={7} onFocus={focus} onBlur={blur}
          />
          <div style={{ width: 36, height: 36, borderRadius: 8, background: primaryColor, border: '1px solid #E5E7EB', flexShrink: 0 }} />
        </div>
      </div>
      <button
        onClick={handleSave} disabled={saving}
        style={{
          background: saved ? '#10B981' : '#69C9CA',
          color: saved ? '#FFFFFF' : '#000000',
          fontWeight: 600, padding: '12px', borderRadius: 8, fontSize: 14,
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif', transition: 'background 200ms',
        }}
      >
        {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Enregistrer'}
      </button>
    </div>
  )
}
