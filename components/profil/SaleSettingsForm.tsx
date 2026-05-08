'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const DEFAULT_SERVICES = [
  { value: 'vitres_ext',     label: 'Lavage vitres ext.' },
  { value: 'vitres_int_ext', label: 'Lavage int./ext.' },
  { value: 'gouttières',     label: 'Gouttières' },
  { value: 'paysager',       label: 'Entretien paysager' },
  { value: 'pave_uni',       label: 'Pavé uni' },
  { value: 'tourbe',         label: 'Pose de tourbe' },
  { value: 'plates_bandes',  label: 'Plates-bandes' },
  { value: 'autre',          label: 'Autre' },
]

interface ServiceItem { value: string; label: string }

interface Props {
  initialSettings: Record<string, string>
  onSaved?: () => void
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  color: '#1F2937',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  background: '#FFFFFF',
}

export default function SaleSettingsForm({ initialSettings, onSaved }: Props) {
  const parseList = (): ServiceItem[] => {
    try {
      if (initialSettings.sale_services) return JSON.parse(initialSettings.sale_services)
    } catch {}
    return DEFAULT_SERVICES
  }

  const [services, setServices] = useState<ServiceItem[]>(parseList())
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addService = () => {
    const label = newLabel.trim()
    if (!label) return
    const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_')
    if (services.some(s => s.value === value)) return
    setServices(prev => [...prev, { value, label }])
    setNewLabel('')
  }

  const removeService = (value: string) => {
    setServices(prev => prev.filter(s => s.value !== value))
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('app_settings')
      .upsert({ key: 'sale_services', value: JSON.stringify(services) }, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSaved?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
        Ces services sont affichés dans le formulaire de création de porte.
      </p>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {services.map(s => (
          <div
            key={s.value}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F9FAFB', borderRadius: 8, padding: '9px 12px',
            }}
          >
            <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{s.value}</span>
            <button
              onClick={() => removeService(s.value)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', display: 'flex', color: '#9CA3AF', borderRadius: 4,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addService()}
          placeholder="Nouveau service..."
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
          onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
        />
        <button
          onClick={addService}
          style={{
            background: '#69C9CA', border: 'none', borderRadius: 8,
            padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Plus size={18} color="#000" />
        </button>
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
